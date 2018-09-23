package org.cedar.psi.registry.stream

import org.apache.kafka.clients.consumer.ConsumerConfig
import org.apache.kafka.common.serialization.Serdes
import org.apache.kafka.streams.StreamsConfig
import org.apache.kafka.streams.TopologyTestDriver
import org.apache.kafka.streams.test.ConsumerRecordFactory
import org.apache.kafka.streams.test.OutputVerifier
import org.cedar.psi.common.serde.JsonSerdes
import org.cedar.psi.registry.service.MetadataStreamService
import spock.lang.Specification

import java.time.ZoneId
import java.time.ZonedDateTime

import static java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME
import static org.cedar.psi.common.constants.Topics.*
import static org.cedar.psi.registry.util.StreamSpecUtils.*


class FullWorkflowSpec extends Specification {

  static final UTC_ID = ZoneId.of('UTC')

  def config = [
      (StreamsConfig.APPLICATION_ID_CONFIG)           : 'delayed_publisher_spec',
      (StreamsConfig.BOOTSTRAP_SERVERS_CONFIG)        : 'localhost:9092',
      (StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG)  : Serdes.String().class.name,
      (StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG): JsonSerdes.Map() .class.name,
      (ConsumerConfig.AUTO_OFFSET_RESET_CONFIG)       : 'earliest'
  ]
  def topology = MetadataStreamService.buildTopology(5000)
  def driver = new TopologyTestDriver(topology, new Properties(config))
  def consumerFactory = new ConsumerRecordFactory(inputTopic('granule'), STRING_SERIALIZER, JSON_SERIALIZER)

  def rawGranuleStore = driver.getKeyValueStore(inputStore('granule'))
  def parsedGranuleStore = driver.getKeyValueStore(parsedStore('granule'))

  def cleanup(){
    driver.close()
  }

  def 'ingests and aggregates raw granule info'() {
    def key = 'A'
    def value1 = ["id":"A","size":42]
    def value2 = ["id":"A","links":[["linkUrl":"http://somewhere.com"]]]

    when:
    driver.pipeInput(consumerFactory.create(inputTopic('granule'), key, value1))
    driver.pipeInput(consumerFactory.create(inputTopic('granule'), key, value2))

    then:
    rawGranuleStore.get('A') == ["id":"A","size":42,"links":[["linkUrl":"http://somewhere.com"]]]
  }

  def 'saves and updates parsed granule info'() {
    def key = 'A'
    def value1 = ["discovery":["title":"replace me"]]
    def value2 = ["discovery":["title":"test"]]
    def value2PlusPublishing = ["discovery":["title":"test"],"publishing":["private":false]]

    when:
    driver.pipeInput(consumerFactory.create(parsedTopic('granule'), key, value1))
    driver.pipeInput(consumerFactory.create(parsedTopic('granule'), key, value2))

    then:
    parsedGranuleStore.get(key) == value2PlusPublishing
    def output = readAllOutput(driver, combinedTopic('granule'))
    OutputVerifier.compareKeyValue(output[0], key, ["input":null,"discovery":["title":"replace me"],"publishing":["private":false]])
    OutputVerifier.compareKeyValue(output[1], key, ["input":null,"discovery":["title":"test"],"publishing":["private":false]])
    output.size() == 2
  }

  def 'sends tombstones for private granules'() {
    def key = 'A'
    def value = ["discovery":["title":"secret"],"publishing":["private":true]]

    when:
    driver.pipeInput(consumerFactory.create(parsedTopic('granule'), key, value))

    then:
    parsedGranuleStore.get(key) == value
    def output = readAllOutput(driver, combinedTopic('granule'))
    OutputVerifier.compareKeyValue(output[0], key, null)
    output.size() == 1
  }

  def 're-publishes granules at an indicated time'() {
    def key = 'A'
    def plusFiveTime = ZonedDateTime.now(UTC_ID).plusSeconds(5)
    def plusFiveString = ISO_OFFSET_DATE_TIME.format(plusFiveTime)
    def plusFiveMessage = ["discovery":["metadata":"yes"],"publishing":["private":true,"until":plusFiveString]]

    when:
    driver.pipeInput(consumerFactory.create(parsedTopic('granule'), key, plusFiveMessage))

    then: // a tombstone is published
    parsedGranuleStore.get(key) == plusFiveMessage
    def output1 = readAllOutput(driver, combinedTopic('granule'))
    OutputVerifier.compareKeyValue(output1[0], key, null)
    output1.size() == 1

    when:
    driver.advanceWallClockTime(6000)

    then:
    parsedGranuleStore.get(key) == plusFiveMessage
    def output2 = readAllOutput(driver, combinedTopic('granule'))
    OutputVerifier.compareKeyValue(output2[0], key, ["input":null,"discovery":["metadata":"yes"],"publishing":["private":true,"until":plusFiveString]])
    output2.size() == 1
  }

}
