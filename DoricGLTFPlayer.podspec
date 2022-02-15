Pod::Spec.new do |s|
    s.name             = 'DoricGLTFPlayer'
    s.version          = '0.1.0'
    s.summary          = 'Doric extension library to display glTF format file'
  
    s.description      = <<-DESC
This provides a extension library to support glTF format files in doric.
                             DESC

    s.homepage         = 'https://github.com/doric-pub/DoricGLTFPlayer'
    s.license          = { :type => 'Apache-2.0', :file => 'LICENSE' }
    s.author           = { 'dev' => 'dev@doric.pub' }
    s.source           = { :git => 'https://github.com/doric-pub/DoricGLTFPlayer.git', :tag => s.version.to_s }
  
    s.ios.deployment_target = '9.0'
  
    s.source_files = 'iOS/Classes/**/*'
    s.resource     =  "dist/**/*"
    s.public_header_files = 'iOS/Classes/**/*.h'
    s.dependency 'DoricCore'
end
