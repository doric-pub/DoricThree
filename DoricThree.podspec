Pod::Spec.new do |s|
    s.name             = 'DoricThree'
    s.version          = '0.1.3'
    s.summary          = 'Doric extension library to use three.js in doric'
  
    s.description      = <<-DESC
This is a extension library that allows developers use three.js library in doric.
                             DESC

    s.homepage         = 'https://github.com/doric-pub/DoricThree'
    s.license          = { :type => 'Apache-2.0', :file => 'LICENSE' }
    s.author           = { 'dev' => 'dev@doric.pub' }
    s.source           = { :git => 'https://github.com/doric-pub/DoricThree.git', :tag => s.version.to_s }
  
    s.ios.deployment_target = '10.0'
  
    s.subspec 'Draco' do |ss|
        ss.source_files = "third_party/draco/include/**/*.{h,cc}"
        ss.vendored_libraries = "third_party/draco/iOS/libdraco.a"
        ss.pod_target_xcconfig = { 
                "HEADER_SEARCH_PATHS" => File.dirname(__FILE__) + "/third_party/draco/include/**",
                'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'arm64'
        }
        ss.public_header_files = "third_party/draco/decoder_webidl_wrapper.h"
        ss.private_header_files = "third_party/draco/include/**/*.h"
        ss.header_mappings_dir = "third_party/draco/include"
        ss.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'arm64' }
    end
    s.subspec 'Main' do |ss|
        ss.source_files = 'iOS/Classes/**/*'
        ss.public_header_files = 'iOS/Classes/**/*.h'
        ss.resource     =  "dist/**/*"
        ss.dependency 'DoricThree/Draco'
        ss.dependency 'DoricCore'
    end
end
