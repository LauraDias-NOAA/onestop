import fetch from 'isomorphic-fetch'

export const INDEX_CHANGE = 'index_change';
export const SEARCH = 'search';
export const SEARCH_COMPLETE = 'search_complete';

export const startSearch = (searchText) => {
  return {
    type: SEARCH,
    searchText
  };
};

export const completeSearch = (searchText, items) => {
  return {
    type: SEARCH_COMPLETE,
    searchText,
    items
  };
};

export const textSearch = (searchText) => {
  return (dispatch, getState) => {
    // if a search is already in flight, let the calling code know there's nothing to wait for
    if (getState().get('inFlight') === true) {
      return Promise.resolve();
    }

    dispatch(startSearch(searchText));

    console.log("Searching: searchText="+getState().get('indexText')+":"+searchText);

    const apiRoot = '//data.nodc.noaa.gov/geoportal/rest/find/document';
    return fetch(`${apiRoot}?searchText=${getState().get('indexText')}:${searchText}&f=json&max=30`)
        .then(response => response.json())
        .then(json => dispatch(completeSearch(searchText, json.records)));
  };
};

export const indexChange = (indexIndex, indexText) => {
  return {
    type: INDEX_CHANGE,
    indexIndex,
    indexText
  };
};