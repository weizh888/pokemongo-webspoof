import React from 'react'
import { action } from 'mobx'
import { observer } from 'mobx-react'

import userLocation from '../../models/user-location.js'

const handleChange = (idx, direction) => action(({ target: { value } }) => {
  if (direction === 'lat' && String(value).indexOf(',') > -1 ) {
    value = value.replace('https://maps.google.com/maps?q=', '');
    value = value.replace('http://maps.google.com/maps?q=', '');
    value = value.replace('https://www.google.com/maps?q=', '');
    value = value.replace('http://www.google.com/maps?q=', '');
    value = value.replace('https://www.google.com/maps/?daddr=', '');
    value = value.split(',')[0]
  }
  if (direction === 'lng' && String(value).indexOf(',') > -1 ) {
    value = value.split(',')[1]
  }
  userLocation[idx] = parseFloat(value)
})

const Coordinates = observer(() =>
  <div className='clearfix coordinates'>
    { [ 'lat', 'lng' ].map((direction, idx) =>
      <div key={ idx } className='pull-xs-left'>
        <div className='input-group'>
          <span className='input-group-text' id='basic-addon1'>
            { direction }
          </span>
          <input
            type='text'
            className='form-control'
            placeholder={ direction }
            aria-describedby='basic-addon1'
            value={ userLocation[idx] }
            onChange={ handleChange(idx, direction) } />
        </div>
      </div>
    ) }
  </div>
)

export default Coordinates
