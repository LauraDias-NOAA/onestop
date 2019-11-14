import React from 'react'
import FlexColumn from '../../common/ui/FlexColumn'
import Button from '../../common/input/Button'
import _ from 'lodash'
import {Key} from '../../../utils/keyboardUtils'
import mapIcon from '../../../../img/font-awesome/white/svg/globe.svg'
import Checkbox from '../../common/input/Checkbox'
import {
  convertBboxToGeoJson,
  convertGeoJsonToBbox,
} from '../../../utils/geoUtils'
import {fontFamilyMonospace} from '../../../utils/styleUtils'
import FilterFieldset from '../FilterFieldset'
import FormSeparator from '../FormSeparator'
import {FilterColors, SiteColors} from '../../../style/defaultStyles'

import Relation from '../Relation'
import GeoRelationIllustration from './GeoRelationIllustration'

import {
  styleFilterPanel,
  styleFieldsetBorder,
  styleForm,
} from '../common/styleFilters'
import ApplyClearRow from '../common/ApplyClearRow'

const styleMapFilter = {
  ...styleFilterPanel,
  ...{
    position: 'relative',
  },
}

const styleDescription = {
  margin: 0,
}

const styleButtonShowMap = {
  fontSize: '1.05em',
}

const styleInputRow = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  margin: '0.618em 0',
  width: '15em',
}

const styleLabel = {
  width: '4em',
}

const styleCoordWrapper = {
  height: '2em',
}

const styleTextBox = {
  width: '10em',
  color: FilterColors.TEXT,
  fontFamily: fontFamilyMonospace(),

  height: '100%',
  margin: 0,
  padding: '0 0.309em',
  border: `1px solid ${FilterColors.LIGHT_SHADOW}`,
  borderRadius: '0.309em',
}

const styleSeparator = {
  borderBottom: `1px solid ${FilterColors.TEXT}`,
  margin: '0.618em 0',
}

export default class MapFilter extends React.Component {
  constructor(props) {
    super(props)
    this.state = this.initialState()
  }

  initialState() {
    return {
      internalGeoJSON: null,
      west: '',
      south: '',
      east: '',
      north: '',
      warning: '',
    }
  }

  componentWillMount() {
    this.mapGeoJSONToState(this.props.geoJSON)
  }

  componentWillUnmount() {
    if (this.props.showMap) {
      this.props.toggleMap()
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.isOpen && nextProps.showMap) {
      this.props.toggleMap()
    }
    this.mapGeoJSONToState(nextProps.geoJSON)
  }

  mapGeoJSONToState = geoJSON => {
    if (geoJSON) {
      let bbox = convertGeoJsonToBbox(geoJSON)
      this.setState({
        internalGeoJSON: geoJSON,
        west: bbox.west,
        south: bbox.south,
        east: bbox.east,
        north: bbox.north,
        warning: '',
      })
    }
    else {
      this.setState(this.initialState())
    }
  }

  handleKeyDown = event => {
    if (event.keyCode === Key.ENTER) {
      event.preventDefault()
      this.applyGeometry()
    }
  }

  handleShowMap = () => {
    const {showMap, toggleMap} = this.props
    if (!showMap && toggleMap) {
      toggleMap()
    }
  }

  handleHideMap = () => {
    const {showMap, toggleMap} = this.props
    if (showMap && toggleMap) {
      toggleMap()
    }
  }

  toggleExcludeGlobalResults = () => {
    this.props.toggleExcludeGlobal()
    this.props.submit()
  }

  applyGeometry = () => {
    if (this.state.internalGeoJSON) {
      // Validation of coordinates is performed in bbox to GeoJSON conversion (geoUtils)
      this.props.handleNewGeometry(this.state.internalGeoJSON)
      this.props.submit()
    }
    else if (
      this.state.west &&
      this.state.south &&
      this.state.east &&
      this.state.north
    ) {
      this.setState({
        warning:
          'Invalid coordinates entered. Valid longitudes are between -180 and 180. Valid latitudes are between -90 and 90, where North is always greater than South.',
      })
    }
    else {
      this.setState({
        warning:
          'Incomplete coordinates entered. Ensure all four fields are populated.',
      })
    }
  }

  clearGeometry = () => {
    this.props.removeGeometry()
    this.props.submit()

    this.setState(this.initialState())
  }

  warningStyle() {
    if (_.isEmpty(this.state.warning)) {
      return {
        display: 'none',
      }
    }
    else {
      return {
        color: SiteColors.WARNING,
        textAlign: 'center',
        margin: '0.75em 0 0.5em',
        fontWeight: 'bold',
        fontSize: '1.15em',
      }
    }
  }

  onChange(event) {
    let field = event.target.name
    let value = event.target.value
    let stateClone = {...this.state}
    stateClone[field] = value

    let {west, south, east, north} = stateClone
    let constructedGeoJSON = convertBboxToGeoJson(west, south, east, north)
    this.setState({
      [field]: value,
      internalGeoJSON: constructedGeoJSON,
      warning: '',
    })
  }

  renderInputRow = (direction, placeholderValue) => {
    let value = this.state[direction]
    let id = `MapFilterCoordinatesInput::${direction}`
    return (
      <div style={styleInputRow}>
        <label htmlFor={id} style={styleLabel}>
          {_.capitalize(direction)}
        </label>
        <div style={styleCoordWrapper}>
          <input
            type="text"
            id={id}
            name={direction}
            placeholder={placeholderValue}
            aria-placeholder={placeholderValue}
            value={value}
            style={styleTextBox}
            onChange={event => this.onChange(event)}
          />
        </div>
      </div>
    )
  }

  renderCoordinateInput = () => {
    return (
      <div key="MapFilterCoordinatesInput::all">
        <form
          style={styleForm}
          onKeyDown={this.handleKeyDown}
          aria-describedby="mapFilterInstructions"
        >
          <FilterFieldset legendText="Bounding Box Coordinates:">
            {this.renderInputRow('west', '-180.0 to 180.0')}
            {this.renderInputRow('south', ' -90.0 to  90.0')}
            {this.renderInputRow('east', '-180.0 to 180.0')}
            {this.renderInputRow('north', ' -90.0 to  90.0')}
          </FilterFieldset>
        </form>
      </div>
    )
  }

  render() {
    const {drawerProxy} = this.props
    const showMapText = this.props.showMap ? 'Hide Map' : 'Show Map'

    const buttonShowMap = (
      <Button
        key="MapFilter::showMapToggle"
        icon={mapIcon}
        text={showMapText}
        onClick={() => {
          this.props.showMap ? this.handleHideMap() : this.handleShowMap()
        }}
        style={styleButtonShowMap}
        styleIcon={{
          width: '1.618em',
          height: '1.618em',
          marginRight: '0.618em',
        }}
        ariaExpanded={this.props.showMap}
      />
    )

    const inputBoundingBox = this.renderCoordinateInput()

    const inputColumn = (
      <FlexColumn
        items={[
          inputBoundingBox,
          <ApplyClearRow
            key="MapFilter::InputColumn::Buttons"
            ariaActionDescription="location filter"
            applyAction={this.applyGeometry}
            clearAction={this.clearGeometry}
          />,
          <div
            key="MapFilter::InputColumn::Warning"
            style={this.warningStyle()}
            role="alert"
          >
            {this.state.warning}
          </div>,
          <FormSeparator key="MapFilter::InputColumn::OR" text="OR" />,
          buttonShowMap,
          drawerProxy,
        ]}
      />
    )

    const excludeGlobalCheckbox = (
      <div style={{marginLeft: '0.309em'}}>
        <Checkbox
          label="Exclude Global Results"
          id="MapFilter::excludeGlobalCheckbox"
          checked={!!this.props.excludeGlobal}
          onChange={this.toggleExcludeGlobalResults}
        />
      </div>
    )

    const illustration = relation => {
      return (
        <GeoRelationIllustration
          relation={relation}
          excludeGlobal={this.props.excludeGlobal}
        />
      )
    }

    return (
      <div style={styleMapFilter}>
        <fieldset style={styleFieldsetBorder}>
          <legend id="mapFilterInstructions" style={styleDescription}>
            Type coordinates or draw on the map. Use the Clear button to reset
            the location filter.
          </legend>
          {inputColumn}
        </fieldset>
        <h4 style={{margin: '0.618em 0 0.618em 0.309em'}}>
          Additional Filtering Options:
        </h4>
        {excludeGlobalCheckbox}
        <Relation
          id="geoRelation"
          relation={this.props.geoRelationship}
          onUpdate={relation => {
            if (relation != this.props.geoRelationship) {
              this.props.updateGeoRelationship(relation)
            }
            if (!_.isEmpty(this.props.geoJSON)) {
              // TODO I think this doesn't require validation because those values are only set at this level if they've passed validation and been submitted...?
              this.props.submit()
            }
          }}
          illustration={illustration}
        />
      </div>
    )
  }
}
