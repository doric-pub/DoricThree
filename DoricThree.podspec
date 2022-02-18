Pod::Spec.new do |s|
    s.name             = 'DoricThree'
    s.version          = '0.1.0'
    s.summary          = 'Doric extension library to use three.js in doric'
  
    s.description      = <<-DESC
This is a extension library that allows developers use three.js library in doric.
                             DESC

    s.homepage         = 'https://github.com/doric-pub/DoricGLTFPlayer'
    s.license          = { :type => 'Apache-2.0', :file => 'LICENSE' }
    s.author           = { 'dev' => 'dev@doric.pub' }
    s.source           = { :git => 'https://github.com/doric-pub/DoricGLTFPlayer.git', :tag => s.version.to_s }
  
    s.ios.deployment_target = '10.0'
  
    s.source_files = 'iOS/Classes/**/*'
    s.resource     =  "dist/**/*"
    s.public_header_files = 'iOS/Classes/**/*.h'
    s.dependency 'DoricCore'
end
