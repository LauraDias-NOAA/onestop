import {connect} from 'react-redux'
import MapFilter from '../spatial/MapFilter'
import {
  collectionToggleExcludeGlobal,
  collectionUpdateGeometry,
  collectionRemoveGeometry,
  collectionUpdateGeoRelation,
} from '../../../actions/routing/CollectionSearchStateActions'
import {toggleMap} from '../../../actions/LayoutActions'
import {submitCollectionSearch} from '../../../actions/routing/CollectionSearchRouteActions'

import {withRouter} from 'react-router'

const mapStateToProps = state => {
  return {
    showMap: state.layout.showMap,
    geoJSON: state.search.collectionFilter.geoJSON,
    geoRelationship: state.search.collectionFilter.geoRelationship,
    excludeGlobal: state.search.collectionFilter.excludeGlobal,
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    updateGeoRelationship: relation => {
      dispatch(collectionUpdateGeoRelation(relation))
    },
    toggleExcludeGlobal: () => {
      dispatch(collectionToggleExcludeGlobal())
    },
    submit: () => {
      dispatch(submitCollectionSearch(ownProps.history))
    },
    toggleMap: () => {
      dispatch(toggleMap())
    },
    removeGeometry: () => dispatch(collectionRemoveGeometry()),
    handleNewGeometry: geoJSON => dispatch(collectionUpdateGeometry(geoJSON)),
  }
}

const CollectionMapFilterContainer = withRouter(
  connect(mapStateToProps, mapDispatchToProps)(MapFilter)
)

export default CollectionMapFilterContainer
