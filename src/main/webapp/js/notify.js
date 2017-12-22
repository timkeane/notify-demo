var GEOCLIENT_URI = 'https://maps.nyc.gov/geoclient/v1/';
var GEOCLIENT_CREDS = {app_id: 'nyc-lib-example', app_key: '74DF5DB1D7320A9A2'};

var view, userLocation;
$(document).ready(function(){
  var map = new nyc.ol.Basemap({
    target: $('#map').get(0)
  });
  view = map.getView();
  addLocationLayer(map);
  $('#ctl00_Content_drpLocationType').change(showForm);
  $('#address-form button').click(geocodeAddress);
  $('#intersection-form button').click(geocodeIntersection);
});

function addLocationLayer(map){
  var source = new ol.source.Vector();
  userLocation = new ol.Feature();
  source.addFeature(userLocation);
  map.addLayer(new ol.layer.Vector({
    source: source,
    style: new ol.style.Style({
      image: nyc.ol.style.locationIcon()
    })
  }));
};

function showForm(){
  var whichForm = $('#ctl00_Content_drpLocationType').val();
  if (whichForm == 'byaddress'){
    $('#intersection-form').hide();
    $('#address-form').show();
  }else if (whichForm == 'byintersection'){
    $('#address-form').hide();
    $('#intersection-form').show();
  }
};

function geocodeAddress(){
  var args = jQuery.extend({
    houseNumber: $('#ctl00_Content_txtBuildingNumber').val(),
    street: $('#ctl00_Content_txtStreetName').val(),
    borough: $('#ctl00_Content_drpAddressBoro').val()
  }, GEOCLIENT_CREDS);
  geocode('address.json', args);
  return false;
};

function geocodeIntersection(){
  var args = jQuery.extend({
    crossStreetOne: $('#ctl00_Content_txtCrossStreetOne').val(),
    crossStreetTwo: $('#ctl00_Content_txtCrossStreetTwo').val(),
    borough: $('#ctl00_Content_drpIntBoro').val()
  }, GEOCLIENT_CREDS);
  geocode('intersection.json', args);
  return false;
};

function geocode(endpoint, args){
  $.ajax({
    url: GEOCLIENT_URI + endpoint,
    data: args,
    dataType: 'jsonp',
    success: handleGeocodeResponse,
    error: function(){
      alert('Your input was not understood');
      console.error(arguments);
    }
  });
};

function isAddressGeocodeSuccess(address){
    return $.inArray(address.returnCode1e, ['00', '01']) > -1 ||
      $.inArray(address.returnCode1a, ['00', '01']) > -1;
};

function isIntersectionGeocodeSuccess(intersection){
    return $.inArray(intersection.geosupportReturnCode, ['00', '01']) > -1;
};

function coordinateForAddress(address){
  if (address.internalLabelXCoordinate && address.internalLabelYCoordinate){
    return [address.internalLabelXCoordinate, address.internalLabelYCoordinate];
  }
    return [address.xCoordinate, address.yCoordinate];
};

function coordinateForIntersection(intersection){
  return [intersection.xCoordinate, intersection.yCoordinate];
};

function handleGeocodeResponse(response){
  var coord;
  if (response.address && isAddressGeocodeSuccess(response.address)){
    coord = coordinateForAddress(response.address);
  }else if (response.intersection && isIntersectionGeocodeSuccess(response.intersection)){
    coord = coordinateForIntersection(response.intersection);
  }else{
    alert('Your input was not understood');
    return;
  }
  showLocation(coord);
};

function showLocation(coord){
  coord = proj4('EPSG:2263', 'EPSG:3857', coord);
  userLocation.setGeometry(new ol.geom.Point(coord));
  view.animate({
    center: coord,
    zoom: 17
  });
};
