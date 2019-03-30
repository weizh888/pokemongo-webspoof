import { capitalize } from 'lodash'

import React, { Component } from 'react'
import { action, observable, computed, decorate } from 'mobx'
import { observer } from 'mobx-react'
import places from 'places.js'
import cx from 'classnames'

import autopilot from '../../models/autopilot.js'

const travelModes = [
  [ 'walk', 9, 'street-view' ],
  [ 'cycling', 13, 'bicycle' ], // Credit to https://github.com/DJLectr0
  [ 'moto', 22, 'motorcycle' ],
  [ 'subway', 50, 'subway' ],
  [ 'truck', 80, 'truck' ],
  [ 'bus', 95, 'car' ],
  [ 'car', 115, 'car' ],
  [ 'rocket', 170, 'rocket' ],
  [ 'tgv', 360, 'train' ],
  [ 'plane', 940, 'plane' ],
  [ 'teleport', '~', 'star' ]
]

@observer
class Autopilot extends Component {

  isModalOpen = false
  travelMode = 'teleport'

  get speed() {
    const [ , speed ] = travelModes.find(([ t ]) => t === this.travelMode)
    return speed
  }

  get travelModeName() {
    const [ travelModeName ] = travelModes.find(([ t ]) => t === this.travelMode)
    return travelModeName
  }

  get travelModeIcon() {
    const [ , , travelModeIcon ] = travelModes.find(([ t ]) => t === this.travelMode)
    return travelModeIcon
  }

  componentDidMount() {
    // initialize algolia places input
    this.placesAutocomplete = places({ container: this.placesEl })
    this.placesAutocomplete.on('change', this.handleSuggestionChange)

    window.addEventListener('keyup', ({ keyCode }) => {
      if (keyCode === 27 && this.isModalOpen) {
        this.handleCancelAutopilot()
      }
      // use the space bar to pause/start autopilot
      if (keyCode === 32) {
        if (autopilot.running && !autopilot.paused) {
          autopilot.pause()
        } else if (autopilot.paused) {
          autopilot.start()
        }
      }
    })
  }

  handleSuggestionChange = ({ suggestion: { latlng: { lat, lng } } }) =>
    autopilot.scheduleTrip(lat, lng)
      .then(() => { if (!this.isModalOpen) this.isModalOpen = true })
      .catch(() => this.placesAutocomplete.setVal(null))

  handleStartAutopilot = () => {
    // reset modal state
    this.placesAutocomplete.setVal(null)

    // TODO: Refactor it's ugly
    // update `autopilot` data
    autopilot.steps = JSON.parse(JSON.stringify(autopilot.accurateSteps))
    autopilot.start()

    this.isModalOpen = false
  }

  handleCancelAutopilot = () => {
    // reset modal state
    this.placesAutocomplete.setVal(null)
    this.isModalOpen = false
  }

  handleSelectTravelMode = (name, speed) => () => {
    autopilot.speed = speed / 3600
    this.travelMode = name
  }

  handleChangeSpeed = () => {
    const { destination: { lat, lng } } = autopilot
    autopilot.pause()
    autopilot.scheduleTrip(lat, lng)
      .then(() => { if (!this.isModalOpen) this.isModalOpen = true })
  }

  renderTogglePause() {
    if (autopilot.running && !autopilot.paused) {
      return (
        <div
          className='toggle pause btn btn-warning'
          onClick={ autopilot.pause }>
          <i className='fa fa-pause' />
        </div>
      )
    }

    if (autopilot.paused) {
      return (
        <div
          className='toggle resume btn btn-success'
          onClick={ autopilot.start }>
          <i className='fa fa-play' />
        </div>
      )
    }
    return <noscript />
  }

  render() {
    return (
      <div className='autopilot'>
        { this.renderTogglePause() }
        { !autopilot.clean &&
          <div
            className='edit btn btn-primary'
            onClick={ this.handleChangeSpeed }>
            <i className={ `fa fa-${this.travelModeIcon}` } />
          </div>
        }
        <div className={ cx('algolia-places', { hide: !autopilot.clean }) }>
          <input ref={ (ref) => { this.placesEl = ref } } type='search' placeholder='Destination' />
        </div>
        { !autopilot.clean &&
          <div
            className='autopilot-btn btn btn-danger'
            onClick={ autopilot.stop }>
            Stop autopilot
          </div> }
        <div className={ cx('autopilot-modal', { open: this.isModalOpen }) }>
          <div className='travel-modes row'>
            { travelModes.map(([ name, speed, icon ]) =>
              <div
                key={ name }
                className={ `col-xs-4 text-center ${name}` }
                onClick={ this.handleSelectTravelMode(name, speed) }>
                <div className={ cx('card travel-mode', { selected: name === this.travelMode }) }>
                  <div className='card-block'>
                    <div className={ `fa fa-${icon}` } />
                    <div className='desc'>
                      <strong>{ capitalize(name) } </strong>
                      <span>{ speed } { speed !== '~' && 'km/h' }</span>
                    </div>
                  </div>
                </div>
              </div>
            ) }
          </div>
          <hr />
          { (autopilot.accurateSteps.length !== 0) ?
            <div className='infos row'>
              <div className='col-xs-4 text-center'>
                <strong>Distance: </strong>
                <span className='tag tag-info'>
                  { autopilot.distance.toFixed(2) } km
                </span>
              </div>
              <div className='col-xs-4 text-center'>
                <strong>Speed: </strong>
                <span className='tag tag-info'>
                  { this.speed } km/h
                </span>
              </div>
              <div className='col-xs-4 text-center'>
                <strong>Time: </strong>
                <span className='tag tag-info'>
                  { autopilot.time }
                </span>
              </div>
            </div> :
            <noscript /> }
          <div className='text-center row'>
            <div className='col-xs-2'>
              <button
                type='button'
                className='btn btn-block btn-sm btn-danger'
                onClick={ this.handleCancelAutopilot }>
                Cancel
              </button>
            </div>
            <div className='col-xs-10'>
              <button
                type='button'
                className='btn btn-block btn-sm btn-success'
                disabled={ autopilot.accurateSteps.length === 0 }
                onClick={ this.handleStartAutopilot }>
                { !autopilot.clean ? 'Update' : 'Start' } autopilot!
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
decorate(Autopilot, {
    isModalOpen: observable,
    travelMode: observable,
    speed: computed,
    travelModeName: computed,
    travelModeIcon: computed,
    handleSuggestionChange: action,
    handleStartAutopilot: action,
    handleCancelAutopilot: action,
    handleSelectTravelMode: action,
    handleChangeSpeed: action
})

export default Autopilot
