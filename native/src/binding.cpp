#include <napi.h>
#include "audio.mm"
#include <vector>

Napi::Array GetDeviceList(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        std::vector<AudioDeviceManager::AudioDevice> devices = AudioDeviceManager::getDeviceList();
        Napi::Array result = Napi::Array::New(env, devices.size());

        for (size_t i = 0; i < devices.size(); i++) {
            Napi::Object device = Napi::Object::New(env);
            device.Set("name", devices[i].name);
            device.Set("id", devices[i].id);
            device.Set("isOutput", devices[i].isOutput);
            result.Set(i, device);
        }

        return result;
    } catch (const std::exception& e) {
        throw Napi::Error::New(env, e.what());
    }
}

Napi::Value GetCurrentDevice(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        AudioDeviceID currentDevice = AudioDeviceManager::getCurrentDevice();
        return Napi::Number::New(env, currentDevice);
    } catch (const std::exception& e) {
        throw Napi::Error::New(env, e.what());
    }
}

Napi::Boolean SetDefaultDevice(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        throw Napi::TypeError::New(env, "AudioDeviceID expected");
    }

    try {
        AudioDeviceID deviceId = info[0].As<Napi::Number>().Uint32Value();
        bool success = AudioDeviceManager::setDefaultDevice(deviceId);
        return Napi::Boolean::New(env, success);
    } catch (const std::exception& e) {
        throw Napi::Error::New(env, e.what());
    }
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("getDeviceList", Napi::Function::New(env, GetDeviceList));
    exports.Set("getCurrentDevice", Napi::Function::New(env, GetCurrentDevice));
    exports.Set("setDefaultDevice", Napi::Function::New(env, SetDefaultDevice));
    return exports;
}

NODE_API_MODULE(audio, Init)