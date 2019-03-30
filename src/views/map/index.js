import axios from 'axios'

import React, { Component } from 'react'
import GoogleMap from 'google-map-react'
import { observable, action, toJS, decorate } from 'mobx'
import { observer } from 'mobx-react'
import Alert from 'react-s-alert'

import userLocation from '../../models/user-location.js'
import settings from '../../models/settings.js'

import SpeedCounter from './speed-counter.js'
import BooleanSettings from './boolean-settings.js'
import Coordinates from './coordinates.js'
import SpeedLimit from './speed-limit.js'
import Controls from './controls.js'
import TotalDistance from './total-distance.js'
import Autopilot from './autopilot.js'
import Pokeball from './pokeball.js'

import MapsApi from '../../config/api.js'

const {clipboard} = window.require('electron')
const {dialog} = window.require('electron').remote

@observer
class Map extends Component {

  map = null

  mapOptions = {
    draggable: true,
    draggableCursor: 'default', // workaround for cursor using 'google-map-react' >= 1.0.0
    draggingCursor: 'move',
    fullscreenControl: false,
    keyboardShortcuts: false,
    minZoom: 2,
    maxZoom: 20,
    resetBoundsOnResize: false
  }

  componentWillMount() {
    // get user geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this.handleGeolocationSuccess,
        this.handleGeolocationFail,
        { enableHighAccuracy: true, maximumAge: 0 }
      )
    }
  }

  // geolocation API might be down, use http://ipinfo.io
  // source: http://stackoverflow.com/a/32338735
  handleGeolocationFail = async (geolocationErr) => {
    Alert.warning(`
      <strong>Error getting your geolocation, using IP location</strong>
      <div class='stack'>${geolocationErr.message}</div>
    `, { timeout: 3000 })

    try {
      const { data: { loc } } = await axios({ url: 'http://ipinfo.io/' })
      const [ latitude, longitude ] = loc.split(',').map(coord => parseFloat(coord))
      this.handleGeolocationSuccess({ coords: { latitude, longitude } })
    } catch (xhrErr) {
      Alert.error(`
        <strong>Could not use IP location</strong>
        <div>Try to restart app, report issue to github</div>
        <div class='stack'>${xhrErr}</div>
      `)
    }
  }

  handleGeolocationSuccess({ coords: { latitude, longitude } }) {
    userLocation.replace([ latitude, longitude ])
  }

  toggleMapDrag = () => {
    this.mapOptions.draggable = !this.mapOptions.draggable
    this.map.map_.setOptions(toJS(this.mapOptions))
  }

  handleGoogleMapClick = ({x, y, lat, lng, event}, force) => {
    //console.log('==> handleMapClick(..) : ' + lat + ',' + lng + ' (x=' + x + ',y=' + y + ')');
    if (!this.mapOptions.draggable || force) {
      this.autopilot.handleSuggestionChange({ suggestion: { latlng: { lat, lng } } })
    }
  }

  /* GoogleMapReact 1.0.5 patch
  handleMapClick2 = ({x, y, lat, lng}) => {
    console.log('==> handleMapClick2(..) : ' + lat + ',' + lng + ' (x=' + x + ',y=' + y + ')');
    if (!this.mapOptions.draggable) {
      this.autopilot.handleSuggestionChange({ suggestion: { latlng: { lat, lng } } })
    }
  }*/

  handleGoogleMapChange = ({ center, zoom, bounds, marginBounds, size }) => {
//    console.log('==> handleGoogleMapChange(..) : center=' + JSON.stringify(center));
//    console.log('==> handleGoogleMapChange(..) : zoom=' + zoom);
//    console.log('==> handleGoogleMapChange(..) : bounds=' + JSON.stringify(bounds));
//    console.log('==> handleGoogleMapChange(..) : marginBounds=' + JSON.stringify(marginBounds));
//    console.log('==> handleGoogleMapChange(..) : size=' + JSON.stringify(size));
  }

  handleGoogleApiLoaded = ({ map, maps }) => {
    /* GoogleMapReact 1.0.5 patch
    map.addListener('click', event => {
      this.handleMapClick2({'x': event.pixel.x, 'y': event.pixel.y, 'lat': event.latLng.lat(), 'lng': event.latLng.lng()}); 
    });*/
  }

  // Perso (copy/paste coordinates as 48.5,2.35)
  handlePasteClick = event => {
    var value = clipboard.readText();
    value = value.replace('https://maps.google.com/maps?q=', '');
    value = value.replace('http://maps.google.com/maps?q=', '');
    value = value.replace('https://www.google.com/maps?q=', '');
    value = value.replace('http://www.google.com/maps?q=', '');
    value = value.replace('https://www.google.com/maps/?daddr=', '');
    value = value.replace(' ', '');
    value = value.replace(';', ',');
    var element = document.getElementById('goto-loc');
    if (element.value === value) {
      return;
    }
    element.setAttribute("data-previous-location", element.value);
    element.value = value;
  }
  handleGotoClick = event => {
    const loc = document.getElementById('goto-loc').value;
    const [ lat, lng ] = loc.split(',').map(coord => parseFloat(coord));
    const choice = dialog.showMessageBox(
         {
            type: 'question',
            buttons: ['Yes', 'No'],
            title: 'Confirm',
            message: 'Going to lat: ' + lat + ', lng: ' + lng + ' ?'
         });
    if (choice == 0) {
      this.autopilot.handleSuggestionChange({ suggestion: { latlng: { lat, lng } } });
    }
  }
  handleBackClick = event => {
    var element = document.getElementById('goto-loc');
    var value = element.getAttribute("data-previous-location");
    if (value != null) {
      element.value = value;
    }
  }
  handleCurrentClick = event => {
    var element = document.getElementById('goto-loc'),
        value = userLocation[0] + ',' + userLocation[1];
    if (element.value === value) {
      return;
    }
    clipboard.writeText(value);
    element.setAttribute("data-previous-location", element.value);
    element.value = value;
  }

  render() {
    const [ latitude, longitude ] = userLocation

    return (
      <div className='google-map-container'>
        { /* only display google map when user geolocated */ }
        { (latitude && longitude) ?
          <GoogleMap
            ref={ (ref) => { this.map = ref } }
            zoom={ settings.zoom.get() }
            center={ [ latitude, longitude ] }
            onClick={ this.handleGoogleMapClick }
            onChange={ this.handleGoogleMapChange }
            options={ () => this.mapOptions }
            onGoogleApiLoaded={ this.handleGoogleApiLoaded }
            yesIWantToUseGoogleMapApiInternals={ true }
            bootstrapURLKeys={{
                key: MapsApi.apiKey,
                language: 'en'
            }}>
            { /* userlocation center */ }
            <Pokeball lat={ userLocation[0] } lng={ userLocation[1] } />
          </GoogleMap> :
          <div
            style={ {
              position: 'absolute',
              top: 'calc(50vh - (100px / 2) - 60px)',
              left: 'calc(50vw - (260px / 2))'
            } }
            className='alert alert-info text-center'>
            <i
              style={ { marginBottom: 10 } }
              className='fa fa-spin fa-2x fa-refresh' />
            <div>Loading user location & map...</div>
          </div> }

        <div className='btn btn-drag-map'>
          { this.mapOptions.draggable ?
            <div
              className='btn btn-sm btn-primary'
              onClick={ this.toggleMapDrag }>
              Map draggable
            </div> :
            <div
              className='btn btn-sm btn-secondary'
              onClick={ this.toggleMapDrag }>
              Map locked
            </div> }
        </div>

        <div className='goto'>
          <div className='input-group'>
            <span className='input-group-text' id='basic-addon-goto'>loc</span>
            <input id='goto-loc' type='text' className='form-control' aria-describedby='basic-addon-goto' />
          </div>
          <div>
            <span className='btn btn-primary btn-sm' onClick={ this.handlePasteClick }>Paste</span>
            <span className='btn btn-primary btn-sm' onClick={ this.handleGotoClick }>Goto</span>
            <span className='btn btn-primary btn-sm' onClick={ this.handleBackClick }>Back</span>
          </div>
          <div>
            <span className='btn btn-primary btn-sm' onClick={ this.handleCurrentClick }>Current</span>
          </div>
        </div>

        { /* controls, settings displayed on top of the map */ }
        <Coordinates />
        <SpeedCounter />
        <SpeedLimit />
        <BooleanSettings />
        <Controls />
        <TotalDistance />
        <Autopilot ref={ (ref) => { this.autopilot = ref } } />
      </div>
    )
  }
}
decorate(Map, {
    mapOptions: observable,
    handleGeolocationSuccess: action,
    toggleMapDrag: action,
    handlePasteClick: action,
    handleGotoClick: action,
    handleBackClick: action,
    handleCurrentClick: action
})

export default Map
