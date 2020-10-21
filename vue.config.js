module.exports = {
  lintOnSave: false,
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId: "com.electron.zzplayer",
        productName: "OrangePlayer",
        publish: ["github"],
        fileAssociations: [
          {
            ext: ["mp3", "wav", "flac", "ogg", "m4a"],
            name: "music",
            role: "Editor"
          }
        ],
        win: {
          icon: "public/orange.ico"
        },
        nsis: {
          oneClick: false, // 是否一键安装，建议为 false，可以让用户点击下一步、下一步、下一步的形式安装程序，如果为true，当用户双击构建好的程序，自动安装程序并打开，即：一键安装
          allowToChangeInstallationDirectory: true // 允许修改安装目录，建议为 true，是否允许用户改变安装目录，默认是不允许
        }
      }
    }
  }
};
