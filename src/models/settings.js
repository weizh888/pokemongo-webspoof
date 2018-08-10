import { observable } from 'mobx'

export default {
  updateXcodeLocation: observable.box(false),
  addJitterToMoves: observable.box(true),
  stationaryUpdates: observable.box(true),
  speedLimit: observable.box(4), // <?? km/h
  zoom: observable.box(17), // map zoom
  googleAPIKey: observable.box('') // Google API Key (private key)
}
