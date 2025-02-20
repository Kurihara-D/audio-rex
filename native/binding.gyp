{
  "targets": [{
    "target_name": "audio",
    "sources": [ "src/audio.mm", "src/binding.cpp" ],
    "include_dirs": [
      "<!@(node -p \"require('node-addon-api').include\")",
      "/System/Library/Frameworks/CoreAudio.framework/Headers",
      "/System/Library/Frameworks/CoreFoundation.framework/Headers"
    ],
    "libraries": [
      "-framework CoreAudio",
      "-framework CoreFoundation"
    ],
    "cflags!": [ "-fno-exceptions" ],
    "cflags_cc!": [ "-fno-exceptions" ],
    "xcode_settings": {
      "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
      "CLANG_CXX_LIBRARY": "libc++",
      "MACOSX_DEPLOYMENT_TARGET": "10.15",
      "CLANG_CXX_LANGUAGE_STANDARD": "c++17",
      'OTHER_CFLAGS': [
        '-ObjC++',
        '-std=c++17'
      ]
    }
  }]
}