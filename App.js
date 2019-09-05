/**
 * @format
 * @flow
 */

import React, {Component} from 'react';
import { Platform, StyleSheet, TouchableHighlight, Text, Image, View } from 'react-native';

import { BleManager } from 'react-native-ble-plx';
import { encode as btoa, decode as atob } from 'base-64';

const kBLEService_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const kBLE_Characteristic_uuid_Tx = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const kBLE_Characteristic_uuid_Rx = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

type Props = {};
export default class App extends Component<Props> {
  constructor(props) {
    super(props)

    this.manager = new BleManager();

    const subscription = this.manager.onStateChange((state) => {
      console.log('BT device state is', state)

      if (state === 'PoweredOn') {
        console.log('Scanning and connecting');
        this.scanAndConnect();
        subscription.remove();
      }
    }, true);
  }

  scanAndConnect() {
    console.log('Scanning');

    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        // Handle error (scanning will be stopped automatically)
        return
      }

      console.log('Found BT device', device.name);

      // Check if it is a device you are looking for based on advertisement data
      // or other criteria.
      if (device.name === 'Bike Jacket') {
        // Stop scanning as it's not necessary if you are scanning for one device.
        this.manager.stopDeviceScan();

        device.connect()
          .then((device) => {
            return device.discoverAllServicesAndCharacteristics();
          })
          .then((device) => {
            const subscription = device.monitorCharacteristicForService(kBLEService_UUID, kBLE_Characteristic_uuid_Rx, (error, characteristic) => {
              this.rx(atob(characteristic.value));
            });
            
            this.device = device;
          })
          .catch((error) => {
            console.log(error);
          });
      }
    });
  }

  tx(message) {
    if (this.device == undefined) {
      return;
    }

    this.device.writeCharacteristicWithResponseForService(kBLEService_UUID, kBLE_Characteristic_uuid_Tx, btoa(message))
      .catch(error => console.log(error));
  }

  rx(message) {
    console.log('Received:', message);
  }

  onPressLeft = () => {
    console.log('Left pressed');
    this.tx('l');
  }

  onPressRight = () => {
    console.log('Right pressed');
    this.tx('r');
  }

  onPressStop = () => {
    console.log('Stop pressed');
    this.tx('s');
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={{fontSize: 50}}>Bike Jacket Control</Text>
        <TouchableHighlight onPress={this.onPressStop}>
          <View style={styles.buttons}>
            <TouchableHighlight onPress={this.onPressLeft} style={{position: 'absolute', left: 0}}>
              <Image style={{width: 110, height: 200}} source={require('./assets/images/left-arrow.png')} />
            </TouchableHighlight>
            <TouchableHighlight onPress={this.onPressRight} style={{position: 'absolute', right: 0}}>
              <Image style={{width: 110, height: 200}} source={require('./assets/images/right-arrow.png')} />
            </TouchableHighlight>
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    margin: 50,
  },
  buttons: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#F5FCFF',
    marginTop: '30%',
  },
});
