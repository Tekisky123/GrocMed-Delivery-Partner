import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors } from '@/constants/Colors';
import { Icon } from '@/components/ui/Icon';

interface MapProps {
  initialRegion: any;
  riderLocation: any;
  destinationLocation: any;
}

export default function AppMap({ initialRegion, riderLocation, destinationLocation }: MapProps) {
  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      initialRegion={initialRegion}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      showsUserLocation={true}
      showsMyLocationButton={false}
      showsCompass={false}
      customMapStyle={mapStyle}
    >
      <Polyline
        coordinates={[riderLocation, destinationLocation]}
        strokeColor={Colors.primary}
        strokeWidth={4}
        lineDashPattern={[1]}
      />

      <Marker coordinate={riderLocation} title="You" flat anchor={{ x: 0.5, y: 0.5 }}>
        <View style={styles.customMarker}>
          <View style={styles.pulse} />
          <View style={styles.riderCircle}>
             <Icon name="navigation" size={18} color="white" library="feather" />
          </View>
        </View>
      </Marker>
      
      <Marker coordinate={destinationLocation} title="Customer">
        <View style={styles.destMarker}>
          <View style={styles.destDot} />
          <Icon name="location-on" size={36} color={Colors.accent} />
        </View>
      </Marker>
    </MapView>
  );
}

const mapStyle = [
  {
    "featureType": "poi",
    "elementType": "labels",
    "stylers": [{ "visibility": "off" }]
  }
];

const styles = StyleSheet.create({
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '25',
  },
  riderCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  destMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  destDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
    top: 6,
    zIndex: 1,
  },
});
