import { DeviceFunctionDef } from './device-function-def';
import { DeviceFunctionResponse } from '../responses/device-function-response';

/**
 * Device functions types
 */
export enum DeviceFunction{
    Power = 'power',
    Brightness = 'brightness',
    FanLightPower = 'light-power',
    FanPower = 'fan-power',
    FanSpeed = 'fan-speed',
    OutletPower = 'power',
    LightTemperature = 'color-temperature',
    LightColor = 'color-rgb',
    ColorMode = 'color-mode',
    // Value Functions
    Toggle = 'toggle',
    MaxOnTime = 'max-on-time',
    BatteryLevel = 'battery-level',
    Timer = 'timer',
    Spigot1 = 'spigot-1',
    Spigot2 = 'spigot-2'
}

/**
 * Supported/implemented device functions
 * with identifiers for discovery and/or manipulation.
 */
export const DeviceFunctions: DeviceFunctionDef[] = [
    {
        functionClass: DeviceFunction.Power,
        functionInstanceName: DeviceFunction.FanLightPower
    },
    {
        functionClass: DeviceFunction.Power,
        functionInstanceName: DeviceFunction.FanPower
    },
    {
        functionClass: DeviceFunction.FanSpeed,
        functionInstanceName: DeviceFunction.FanSpeed
    },
    {
        functionClass: DeviceFunction.Power
    },
    {
        functionClass: DeviceFunction.Brightness
    },
    {
        functionClass: DeviceFunction.OutletPower
    },
    {
        functionClass: DeviceFunction.LightTemperature
    },
    {
        functionClass: DeviceFunction.LightColor
    },
    // This is to switch between Temperature (val:0) and Color (val:1) Light Modes, as Homekit sees these as mutually
    // exclusive, the value should always be Color (val:1) when being controlled by Homekit, otherwise 'undefined' will
    // be returned when reading the current color setting
    {
        functionClass: DeviceFunction.ColorMode
    },
    {
        functionClass: DeviceFunction.BatteryLevel
    },
    {
        functionClass: DeviceFunction.Toggle,
        functionInstanceName: DeviceFunction.Spigot1
    },
    {
        functionClass: DeviceFunction.MaxOnTime,
        functionInstanceName: DeviceFunction.Spigot1
    },
    {
        functionClass: DeviceFunction.Timer,
        functionInstanceName: DeviceFunction.Spigot1
    },
    {
        functionClass: DeviceFunction.Toggle,
        functionInstanceName: DeviceFunction.Spigot2
    },
    {
        functionClass: DeviceFunction.MaxOnTime,
        functionInstanceName: DeviceFunction.Spigot2
    },
    {
        functionClass: DeviceFunction.Timer,
        functionInstanceName: DeviceFunction.Spigot2
    }
];

/**
 * Gets function definition for a type
 * @param deviceFunction Function type
 * @returns Function definition for type
 * @throws {@link Error} when a type has no definition associated with it
 */
export function getDeviceFunctionDef(
    deviceFunctionResponse: DeviceFunctionResponse[], deviceFunction: DeviceFunction): DeviceFunctionResponse{

    const fc = deviceFunctionResponse.find(fc => fc.functionClass === deviceFunction);

    // Throw an error when not found - function definition must be set during development,
    // otherwise the plugin will not work as expected.
    if(!fc){
        throw new Error(`Failed to get function definition for '${deviceFunction}'. Each function requires to set a definition.`);
    }

    return fc;
}