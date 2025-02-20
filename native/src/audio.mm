#import <CoreAudio/CoreAudio.h>
#import <Foundation/Foundation.h>
#include <string>
#include <vector>

class AudioDeviceManager {
public:
    struct AudioDevice {
        std::string name;
        AudioDeviceID id;
        bool isOutput;
    };

    static std::vector<AudioDevice> getDeviceList() {
        std::vector<AudioDevice> devices;
        
        AudioObjectPropertyAddress propertyAddress = {
            kAudioHardwarePropertyDevices,
            kAudioObjectPropertyScopeGlobal,
            kAudioObjectPropertyElementMain
        };

        UInt32 dataSize = 0;
        OSStatus status = AudioObjectGetPropertyDataSize(kAudioObjectSystemObject,
                                                       &propertyAddress,
                                                       0,
                                                       NULL,
                                                       &dataSize);
        if (status != kAudioHardwareNoError) {
            return devices;
        }

        int deviceCount = dataSize / sizeof(AudioDeviceID);
        AudioDeviceID* audioDevices = new AudioDeviceID[deviceCount];

        status = AudioObjectGetPropertyData(kAudioObjectSystemObject,
                                          &propertyAddress,
                                          0,
                                          NULL,
                                          &dataSize,
                                          audioDevices);

        if (status == kAudioHardwareNoError) {
            for (int i = 0; i < deviceCount; i++) {
                CFStringRef deviceName = NULL;
                dataSize = sizeof(deviceName);
                propertyAddress.mSelector = kAudioDevicePropertyDeviceNameCFString;
                propertyAddress.mScope = kAudioObjectPropertyScopeGlobal;
                
                status = AudioObjectGetPropertyData(audioDevices[i],
                                                  &propertyAddress,
                                                  0,
                                                  NULL,
                                                  &dataSize,
                                                  &deviceName);

                if (status == kAudioHardwareNoError && deviceName) {
                    NSString *nsDeviceName = (__bridge NSString *)deviceName;
                    AudioDevice device;
                    device.name = std::string([nsDeviceName UTF8String]);
                    device.id = audioDevices[i];
                    device.isOutput = isOutputDevice(audioDevices[i]);
                    devices.push_back(device);
                    CFRelease(deviceName);
                }
            }
        }

        delete[] audioDevices;
        return devices;
    }

    static AudioDeviceID getCurrentDevice() {
        AudioDeviceID outputDevice;
        UInt32 dataSize = sizeof(AudioDeviceID);
        AudioObjectPropertyAddress propertyAddress = {
            kAudioHardwarePropertyDefaultOutputDevice,
            kAudioObjectPropertyScopeGlobal,
            kAudioObjectPropertyElementMain
        };

        OSStatus status = AudioObjectGetPropertyData(kAudioObjectSystemObject,
                                                   &propertyAddress,
                                                   0,
                                                   NULL,
                                                   &dataSize,
                                                   &outputDevice);

        if (status != kAudioHardwareNoError) {
            return 0;
        }

        return outputDevice;
    }

    static bool setDefaultDevice(AudioDeviceID deviceId) {
        AudioObjectPropertyAddress propertyAddress = {
            kAudioHardwarePropertyDefaultOutputDevice,
            kAudioObjectPropertyScopeGlobal,
            kAudioObjectPropertyElementMain
        };

        OSStatus status = AudioObjectSetPropertyData(kAudioObjectSystemObject,
                                                   &propertyAddress,
                                                   0,
                                                   NULL,
                                                   sizeof(AudioDeviceID),
                                                   &deviceId);

        return status == kAudioHardwareNoError;
    }

private:
    static bool isOutputDevice(AudioDeviceID deviceId) {
        AudioObjectPropertyAddress propertyAddress = {
            kAudioDevicePropertyStreamConfiguration,
            kAudioDevicePropertyScopeOutput,
            0
        };

        UInt32 dataSize = 0;
        OSStatus status = AudioObjectGetPropertyDataSize(deviceId,
                                                       &propertyAddress,
                                                       0,
                                                       NULL,
                                                       &dataSize);

        if (status != kAudioHardwareNoError) {
            return false;
        }

        AudioBufferList* bufferList = (AudioBufferList*)malloc(dataSize);
        status = AudioObjectGetPropertyData(deviceId,
                                          &propertyAddress,
                                          0,
                                          NULL,
                                          &dataSize,
                                          bufferList);

        bool hasOutputChannels = false;
        if (status == kAudioHardwareNoError) {
            hasOutputChannels = bufferList->mNumberBuffers > 0;
        }

        free(bufferList);
        return hasOutputChannels;
    }
};