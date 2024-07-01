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
        super(platform, accessory, [new platform.Service.Valve('1', '1'), new platform.Service.Valve('2', '2'), platform.Service.Battery]);

        this.configureSprinkler();
    }

    private configureSprinkler(): void{
        if(this.supportsFunction(DeviceFunction.Toggle)){
            this.services[0].getCharacteristic(this.platform.Characteristic.Active)
                .onGet(() => this.getActive(DeviceFunction.Spigot1))
                .onSet((value) => this.setActive(DeviceFunction.Spigot1, value));
            this.services[0].getCharacteristic(this.platform.Characteristic.InUse)
                .onGet(() => this.getInUse(DeviceFunction.Spigot1));
            this.services[0].getCharacteristic(this.platform.Characteristic.ValveType)
                .onGet(() => this.platform.api.hap.Characteristic.ValveType.IRRIGATION);

            this.services[1].getCharacteristic(this.platform.Characteristic.Active)
                .onGet(() => this.getActive(DeviceFunction.Spigot2))
                .onSet((value) => this.setActive(DeviceFunction.Spigot2, value));
            this.services[1].getCharacteristic(this.platform.Characteristic.InUse)
                .onGet(() => this.getInUse(DeviceFunction.Spigot2));
            this.services[1].getCharacteristic(this.platform.Characteristic.ValveType)
                .onGet(() => this.platform.api.hap.Characteristic.ValveType.IRRIGATION);
        }
        if(this.supportsFunction(DeviceFunction.Timer)) {
            // this.services[0].getCharacteristic(this.platform.Characteristic.RemainingDuration)
            //     .onGet(() => this.getRemainingDuration(DeviceFunction.Spigot1));
            this.services[0].getCharacteristic(this.platform.Characteristic.SetDuration)
                .onGet(() => this.getMaxDuration(DeviceFunction.Spigot1))
                .onSet((value) => this.setMaxDuration(DeviceFunction.Spigot1, value));

            // this.services[1].getCharacteristic(this.platform.Characteristic.RemainingDuration)
            //     .onGet(() => this.getRemainingDuration(DeviceFunction.Spigot2));
            this.services[1].getCharacteristic(this.platform.Characteristic.SetDuration)
                .onGet(() => this.getRemainingDuration(DeviceFunction.Spigot2))
                .onSet((value) => this.setMaxDuration(DeviceFunction.Spigot2, value));
        }

        if(this.supportsFunction(DeviceFunction.BatteryLevel)) {
            this.services[2].getCharacteristic(this.platform.Characteristic.StatusLowBattery)
                .onGet(this.getStatusLowBattery.bind(this));
            this.services[2].getCharacteristic(this.platform.Characteristic.BatteryLevel)
                .onGet(this.getBatteryLevel.bind(this));
        }
    }

    private async getActive(functionType: DeviceFunction): Promise<CharacteristicValue>{
        // Try to get the value
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Toggle, functionType);
        const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.values[0].deviceValues[0].key);

        // If the value is not defined then show 'Not Responding'
        if(isNullOrUndefined(value)){
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }

        this.log.debug(`${this.device.name}: Triggered GET Active: ${value}`);
        // Otherwise return the value
        return value! ? this.platform.api.hap.Characteristic.Active.ACTIVE : this.platform.api.hap.Characteristic.Active.INACTIVE;
    }

    private async setActive(functionType: DeviceFunction, value: CharacteristicValue): Promise<void>{
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Toggle, functionType);
        this.log.debug(`${this.device.name}: Triggered SET Active: ${value}`);
        await this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, value);

        if (functionType === DeviceFunction.Spigot1) {
            this.services[0].updateCharacteristic(this.platform.Characteristic.InUse, value);
            this.services[0].updateCharacteristic(this.platform.Characteristic.Active, value);
            if (value === this.platform.api.hap.Characteristic.Active.INACTIVE) {
                this.services[0].updateCharacteristic(this.platform.Characteristic.RemainingDuration, 0);
            } else {
                /* TODO: figure out how to query this */
                this.services[0].updateCharacteristic(
                    this.platform.Characteristic.RemainingDuration, await this.getMaxDuration(functionType));
            }
        } else if (functionType === DeviceFunction.Spigot2) {
            this.services[1].updateCharacteristic(this.platform.Characteristic.InUse, value);
            this.services[1].updateCharacteristic(this.platform.Characteristic.Active, value);
            if (value === this.platform.api.hap.Characteristic.Active.INACTIVE) {
                this.services[1].updateCharacteristic(this.platform.Characteristic.RemainingDuration, 0);
            } else {
                /* TODO: figure out how to query this */
                this.services[1].updateCharacteristic(
                    this.platform.Characteristic.RemainingDuration, await this.getMaxDuration(functionType));
            }
        }
    }

    private async getInUse(functionType: DeviceFunction): Promise<CharacteristicValue>{
        // Try to get the value
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Toggle, functionType);
        const value = await this.deviceService.getValueAsBoolean(this.device.deviceId, func.values[0].deviceValues[0].key);

        // If the value is not defined then show 'Not Responding'
        if(isNullOrUndefined(value)){
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }

        this.log.debug(`${this.device.name}: Triggered GET InUse: ${value}`);
        // Otherwise return the value
        return value! ? this.platform.api.hap.Characteristic.InUse.IN_USE : this.platform.api.hap.Characteristic.InUse.NOT_IN_USE;
    }

    private async getRemainingDuration(functionType: DeviceFunction): Promise<CharacteristicValue>{
        // Try to get the value
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.Timer, functionType);
        const value = await this.deviceService.getValueAsInteger(this.device.deviceId, func.values[0].deviceValues[0].key);

        // If the value is not defined then show 'Not Responding'
        if(isNullOrUndefined(value)){
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }

        this.log.debug(`${this.device.name}: Triggered GET Remaining Duration: ${value}`);
        // Otherwise return the value
        return value!;
    }

    private async setMaxDuration(functionType: DeviceFunction, value: CharacteristicValue): Promise<void>{
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.MaxOnTime, functionType);
        this.log.debug(`${this.device.name}: Triggered SET Max Duration: ${value}`);
        const minutes = (value as number) / 60;
        await this.deviceService.setValue(this.device.deviceId, func.values[0].deviceValues[0].key, minutes);
    }

    private async getMaxDuration(functionType: DeviceFunction): Promise<CharacteristicValue>{
        // Try to get the value
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.MaxOnTime, functionType);
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

    private async getStatusLowBattery(): Promise<CharacteristicValue>{
        // Try to get the value
        const func = getDeviceFunctionDef(this.device.functions, DeviceFunction.BatteryLevel);
        const value = await this.deviceService.getValueAsInteger(this.device.deviceId, func.values[0].deviceValues[0].key);

        // If the value is not defined then show 'Not Responding'
        if(isNullOrUndefined(value)){
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }

        let ret;
        if ((value as number) <= 20) {
            ret = this.platform.api.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW;
        } else {
            ret = this.platform.api.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
        }

        this.log.debug(`${this.device.name}: Triggered GET Battery Level: ${ret}`);

        return ret!;
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
}