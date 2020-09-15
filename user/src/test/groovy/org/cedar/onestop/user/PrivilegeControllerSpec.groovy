package org.cedar.onestop.user

import org.cedar.onestop.user.config.SecurityConfig
import org.cedar.onestop.user.controller.PrivilegeController
import org.cedar.onestop.user.controller.UserController
import org.cedar.onestop.user.domain.OnestopPrivilege
import org.cedar.onestop.user.domain.OnestopUser
import org.cedar.onestop.user.repository.OnestopPrivilegeRepository
import org.cedar.onestop.user.repository.OnestopUserRepository
import org.spockframework.spring.SpringBean
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.http.MediaType
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.result.MockMvcResultMatchers
import spock.lang.Shared
import spock.lang.Specification

import java.util.Optional;

@WebMvcTest(controllers = PrivilegeController.class)
class PrivilegeControllerSpec extends Specification{

  @Autowired
  private MockMvc mockMvc

  @Autowired
  private PrivilegeController privilegeController

  @SpringBean
  private OnestopPrivilegeRepository onestopPrivilegeRepository = Mock()

  @SpringBean
  private OnestopUserRepository onestopUserRepository = Mock()

  @Shared
  String privilegeId = "auto-generated-uuid"
  @Shared
  String privilegeName = "test_privilege"
  @Shared
  String privilegeJsonString = "{\"id\":\"${privilegeId}\", \"name\": \"${privilegeName}\"}" as String
  @Shared
  OnestopPrivilege mockPrivilege = new OnestopPrivilege(privilegeId, privilegeName)

  @WithMockUser(username = "admin_user_privileges", roles = ["ADMIN"])
  def "admin user can hit privilege endpoint"() {
    given:
    String id = "admin_id"
    when:
    def getResults = mockMvc.perform(MockMvcRequestBuilders
        .get("/v1/privilege/{id}", id)
        .accept(MediaType.APPLICATION_JSON))

    then:
    1 * onestopUserRepository.findById(id) >>  Optional.of((OnestopUser) new OnestopUser("admin_id"))

    getResults.andExpect(MockMvcResultMatchers.status().isOk())
  }


  @WithMockUser(username = "privilege_hacker", roles = [SecurityConfig.PUBLIC_PRIVILEGE])
  def "public user not authorized to hit privilege endpoint"() {
    when:
    def getResults = mockMvc.perform(MockMvcRequestBuilders
        .get("/v1/privilege/{id}", "hacker_id")
        .accept(MediaType.APPLICATION_JSON))

    then:
    getResults.andExpect(MockMvcResultMatchers.status().isForbidden())
  }

  @WithMockUser(roles = [SecurityConfig.ADMIN_PRIVILEGE])
  def "privilege is created"() {
    when:
    def postSearch = mockMvc.perform(MockMvcRequestBuilders
        .post("/v1/privilege")
        .contentType("application/json")
        .content(privilegeJsonString)
        .accept(MediaType.APPLICATION_JSON))

    then:
    1 * onestopPrivilegeRepository.save(_ as OnestopPrivilege) >> new OnestopPrivilege(privilegeId, privilegeName) //>> new OnestopUser("new_user")

    postSearch.andExpect(MockMvcResultMatchers.status().isCreated())
        .andExpect(MockMvcResultMatchers.jsonPath("\$.data[0].id").value(privilegeId))
  }

  @WithMockUser(roles = [SecurityConfig.ADMIN_PRIVILEGE])
  def 'privilege is deleted'(){
    when:
    def deleteResult = mockMvc.perform(MockMvcRequestBuilders.delete("/v1/privilege/{id}", privilegeId))

    then:
    deleteResult.andExpect(MockMvcResultMatchers.status().isOk())
    1 * onestopPrivilegeRepository.findById(_ as String) >> Optional.of((OnestopPrivilege)mockPrivilege)
    1 * onestopPrivilegeRepository.delete(_ as OnestopPrivilege)
    deleteResult.andExpect(MockMvcResultMatchers.jsonPath("\$.meta.nonStandardMetadata.deleted").value(true))
  }

}