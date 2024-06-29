import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { DeviceFunction, getDeviceFunctionDef } from '../models/device-functions';
import { HubspacePlatform } from '../platform';
import { isNullOrUndefined } from '../utils';
import { HubspaceAccessory } from './hubspace-accessory';

export class SprinklerAccessory extends HubspaceAccessory{

    /**
     * Crates a new instance of the accessory
     * @param platform Hubspace platform
     * @param accessory Platform accessory
     */
    constructor(platform: HubspacePlatform, accessory: PlatformAccessory) {
        super(platform, accessory, platform.Service.Valve);

        this.configureSprinkler();
    }

    private configureSprinkler(): void{
        if(this.supportsFunction(DeviceFunction.Toggle)){
            this.service.getCharacteristic(this.platform.Characteristic.Active)
                .onGet(this.getActive.bind(this))
                .onSet(this.setActive.bind(this));
            this.service.getCharacteristic(this.platform.Characteristic.InUse)
                .onGet(this.getInUse.bind(this));
            this.service.getCharacteristic(this.platform.Characteristic.ValveType)
                .onGet(this.getValveType.bind(this));
        }
        if(this.supportsFunction(DeviceFunction.BatteryLevel)) {
            this.service.getCharacteristic(this.platform.Characteristic.BatteryLevel)
                .onGet(this.getBatteryLevel.bind(this));
        }
        if(this.supportsFunction(DeviceFunction.Timer)) {
            this.service.getCharacteristic(this.platform.Characteristic.RemainingDuration)
                .onGet(this.getRemainingDuration.bind(this));
            this.service.getCharacteristic(this.platform.Characteristic.SetDuration)
                .onGet(this.getMaxDuration.bind(this))
                .onSet(this.setMaxDuration.bind(this));
        }
    }

    private async getActive(): Promise<CharacteristicValue>{
        // Try to get the value
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Toggle);
        const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.values[0].deviceValues[0].key);

        // If the value is not defined then show 'Not Responding'
        if(isNullOrUndefined(value)){
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }

        this.log.debug(`${this.device.name}: Triggered GET Active: ${value}`);
        // Otherwise return the value
        return value! ? this.platform.api.hap.Characteristic.Active.ACTIVE : this.platform.api.hap.Characteristic.Active.INACTIVE;
    }

    private async setActive(value: CharacteristicValue): Promise<void>{
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Toggle);
        this.log.debug(`${this.device.name}: Triggered SET Active: ${value}`);
        await this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, value);
    }

    private async getInUse(): Promise<CharacteristicValue>{
        // Try to get the value
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Toggle);
        const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.values[0].deviceValues[0].key);

        // If the value is not defined then show 'Not Responding'
        if(isNullOrUndefined(value)){
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }

        this.log.debug(`${this.device.name}: Triggered GET InUse: ${value}`);
        // Otherwise return the value
        return value! ? this.platform.api.hap.Characteristic.InUse.IN_USE : this.platform.api.hap.Characteristic.InUse.NOT_IN_USE;
    }

    private async getValveType(): Promise<CharacteristicValue>{
        this.log.debug(`${this.device.name}: Triggered GET ValveType`);
        return this.platform.api.hap.Characteristic.ValveType.IRRIGATION;
    }

    private async getBatteryLevel(): Promise<CharacteristicValue>{
        // Try to get the value
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.BatteryLevel);
        const value = await this.deviceService.getValueAsInteger(this.device.deviceId, func.values[0].deviceValues[0].key);

        // If the value is not defined then show 'Not Responding'
        if(isNullOrUndefined(value)){
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }

        this.log.debug(`${this.device.name}: Triggered GET Battery Level: ${value}`);
        // Otherwise return the value
        return value!;
    }

    private async getRemainingDuration(): Promise<CharacteristicValue>{
        // Try to get the value
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Timer);
        const value = await this.deviceService.getValueAsInteger(this.device.deviceId, func.values[0].deviceValues[0].key);

        // If the value is not defined then show 'Not Responding'
        if(isNullOrUndefined(value)){
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }

        this.log.debug(`${this.device.name}: Triggered GET Remaining Duration: ${value}`);
        // Otherwise return the value
        return value!;
    }

    private async setMaxDuration(value: CharacteristicValue): Promise<void>{
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.MaxOnTime);
        this.log.debug(`${this.device.name}: Triggered SET Max Duration: ${value}`);
        const minutes = (value as number) / 60;
        await this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, minutes);
    }

    private async getMaxDuration(): Promise<CharacteristicValue>{
        // Try to get the value
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.MaxOnTime);
        const value = await this.deviceService.getValueAsInteger(this.device.deviceId, func.values[0].deviceValues[0].key);

        // If the value is not defined then show 'Not Responding'
        if(isNullOrUndefined(value)){
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }

        this.log.debug(`${this.device.name}: Triggered GET Max Duration: ${value}`);
        let seconds = (value as number) * 60;
        if (seconds > 3600) {
            seconds = 3600;
        }
        // Otherwise return the value
        return seconds!;
    }
}