import { SET_REPO_ADD_VALUE, ADD_REPO_TO_BUFFER, CREATE_REPO, SUCCESS, REQUEST, FAILURE } from '../actions'
import { combineReducers } from 'redux'

function value (state = '', action) {
  switch (action.type) {
    case SET_REPO_ADD_VALUE:
      return action.value
    case ADD_REPO_TO_BUFFER:
    case CREATE_REPO[SUCCESS]:
      return ''
    default:
      return state
  }
}

function disabled (state = false, action) {
  switch (action.type) {
    case CREATE_REPO[REQUEST]:
      return true
    case CREATE_REPO[SUCCESS]:
    case CREATE_REPO[FAILURE]:
      return false
    default:
      return state
  }
}

export default combineReducers({
  value,
  disabled
})
