import {connect} from 'react-redux'
import {withRouter} from 'react-router'
import {
  collectionToggleExcludeGlobal,
  collectionToggleFacet,
  collectionUpdateDateRange,
  collectionUpdateYearRange,
  collectionRemoveGeometry,
} from '../../../actions/routing/CollectionSearchStateActions'
import {submitCollectionSearch} from '../../../actions/routing/CollectionSearchRouteActions'
import AppliedFilters from '../AppliedFilters'

const mapStateToProps = state => {
  const {
    selectedFacets,
    startDateTime,
    endDateTime,
    startYear,
    endYear,
    bbox,
    excludeGlobal,
  } = state.search.collectionFilter
  return {
    selectedFacets,
    startDateTime,
    endDateTime,
    startYear,
    endYear,
    bbox,
    excludeGlobal,
    showAppliedFilters: state.layout.showAppliedFilterBubbles,
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    toggleExcludeGlobal: () => {
      dispatch(collectionToggleExcludeGlobal())
    },
    toggleFacet: (category, facetName, selected) =>
      dispatch(collectionToggleFacet(category, facetName, selected)),
    submit: () => {
      dispatch(submitCollectionSearch(ownProps.history))
    },
    updateDateRange: (startDate, endDate) =>
      dispatch(collectionUpdateDateRange(startDate, endDate)),
    updateYearRange: (startYear, endYear) =>
      dispatch(collectionUpdateYearRange(startYear, endYear)),
    removeGeometry: () => dispatch(collectionRemoveGeometry()),
  }
}

const CollectionAppliedFiltersContainer = withRouter(
  connect(mapStateToProps, mapDispatchToProps)(AppliedFilters)
)

export default CollectionAppliedFiltersContainer
