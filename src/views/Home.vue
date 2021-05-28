<template>
  <div class="mixin-components-container">
    <div>
      <div class="box-card" style="text-align:left">
        <div class="title-box">
          <p class="songName">{{ songName }}</p>
        </div>

        <div id="waveform" ref="waveform"></div>

        <div class="player__controls controls">
          <button
            @click="playPre(filePath)"
            class="btn controls__btn controls__btn--prev"
          >
            <i class="fa fa-backward"></i>
          </button>
          <button
            @click="playMusic"
            class="btn controls__btn controls__btn--play-pause"
          >
            <i v-if="playing" class="fa fa-fw fa-pause"></i>
            <i v-else class="fa fa-fw fa-play"></i>
          </button>
          <button
            @click="playNext(filePath)"
            class="btn controls__btn controls__btn--next"
          >
            <i class="fa fa-forward"></i>
          </button>
          <button class="btn controls__btn controls__btn--volume">
            <div class="volum-control">
              <i class="fa fa-volume-up" aria-hidden="true"></i>
              <input
                v-model="vol"
                :style="
                  `background-image:linear-gradient( to right, ${fillColor}, ${fillColor} ${percent}, ${emptyColor} ${percent})`
                "
                class="volume"
                type="range"
                min="0"
                max="100"
                id="fader"
                @input="changeVol"
              />
            </div>
            <!-- <output for=fader id=volume>50</output> -->
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import WaveSurfer from "wavesurfer.js";
// import Timeline from "wavesurfer.js/dist/plugin/wavesurfer.timeline.js";
// import Spectrogram from "wavesurfer.js/dist/plugin/wavesurfer.spectrogram.js";
const path = window.path;
const fs = window.fs;
const { Readable } = require("stream");
const streamToBlob = require("stream-to-blob");
const { ipcRenderer } = window.require("electron");
// const remote = require("electron").remote;

export default {
  name: "Details",
  data() {
    return {
      wavesurfer: null,
      filePath: "",
      playing: false,
      songName: "",
      fillColor: "rgba(48, 113, 169, 0.8)",
      emptyColor: "rgba(48, 113, 169, 0.4)",
      percent: "30%",
      vol: 30
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.wavesurfer = WaveSurfer.create({
        container: this.$refs.waveform,
        barWidth: 2,
        barHeight: 1,
        barGap: 1,
        barRadius: 2,
        waveColor: "#006d75",
        progressColor: "#597ef7",
        backend: "MediaElement",
        mediaControls: false,
        audioRate: "1"
      });

      // 首次加载
      // let originPath = remote.process.argv[1];
      // let originPath = '/Users/kerin/Downloads/艾辰 - 错位时空.mp3';
      // this.loadMusic(originPath);

      // 播放其他歌曲，监听主进程senond-instance传过来的第二首歌曲的本地路径
      ipcRenderer.send("getPath");
      ipcRenderer.on("path", (event, arg) => {
        console.log({ path });
        const newOriginPath = arg;

        // console.log(newOriginPath);
        this.loadMusic(newOriginPath);
      });
    });
  },
  methods: {
    playMusic() {
      //"播放/暂停"按钮的单击触发事件，暂停的话单击则播放，正在播放的话单击则暂停播放
      this.playing = !this.playing;
      this.wavesurfer.playPause.bind(this.wavesurfer)();
    },
    changeVol(e) {
      let val = e.target.value;
      let min = e.target.min;
      let max = e.target.max;
      let rate = (val - min) / (max - min);
      this.percent = 100 * rate + "%";
      console.log(this.percent, rate);
      this.wavesurfer.setVolume(Number(rate));
    },

    loadMusic(diskPath) {
      this.filePath = diskPath;
      this.songName = path.basename(diskPath);
      let buffer = fs.readFileSync(diskPath); //读取文件，并将缓存区进行转换

      let stream = this.bufferToStream(buffer); //将buffer数据转换成node 可读流

      let fileUrl; // blob对象
      streamToBlob(stream)
        .then(res => {
          fileUrl = res;
          // console.log(fileUrl);

          //将blob对象转成blob链接
          let filePath = window.URL.createObjectURL(fileUrl);
          // console.log(filePath);
          this.wavesurfer.load(filePath);

          // 自动播放
          this.wavesurfer.play();
          this.playing = true;
        })
        .catch(err => {
          console.log(err);
        });
    },

    playPre(diskPath) {
      this.playFileList(diskPath, "pre");
    },
    playNext(diskPath) {
      this.playFileList(diskPath, "next");
    },

    playFileList(diskPath, pos) {
      let isInFiles;
      let fileIndex;
      let preIndex;
      let nextIndex;
      let fullPath;
      let dirPath = path.dirname(diskPath);
      let basename = path.basename(diskPath);
      fs.readdir(dirPath, (err, files) => {
        isInFiles = files.includes(basename);

        if (isInFiles && pos === "pre") {
          fileIndex = files.indexOf(basename);
          preIndex = fileIndex - 1;
          fullPath = path.resolve(dirPath, files[preIndex]);

          this.loadMusic(fullPath);
        }
        if (isInFiles && pos === "next") {
          fileIndex = files.indexOf(basename);
          nextIndex = fileIndex + 1;
          fullPath = path.resolve(dirPath, files[nextIndex]);
          this.loadMusic(fullPath);
        }
      });
    },

    bufferToStream(binary) {
      const readableInstanceStream = new Readable({
        read() {
          this.push(binary);
          this.push(null);
        }
      });

      return readableInstanceStream;
    }
  }
};
</script>
<style lang="less" scoped>
.mixin-components-container {
  // padding-top: 60px;
  .title-box {
    width: 200px;
    margin: 0 auto;
    overflow: hidden;
    .songName {
      text-align: center;
      padding-left: 20px;
      font-size: 16px;
      color: #fff;
      display: inline-block;
      white-space: nowrap;
      animation: 10s wordsLoop linear infinite normal;
    }
    @keyframes wordsLoop {
      0% {
        transform: translateX(200px);
        -webkit-transform: translateX(200px);
      }
      100% {
        transform: translateX(-100%);
        -webkit-transform: translateX(-100%);
      }
    }

    @-webkit-keyframes wordsLoop {
      0% {
        transform: translateX(200px);
        -webkit-transform: translateX(200px);
      }
      100% {
        transform: translateX(-100%);
        -webkit-transform: translateX(-100%);
      }
    }
  }
  #waveform {
    -webkit-app-region: no-drag;
    margin: 0 20px;
  }
  .player__controls {
    width: 50%;
    margin: 0 auto;
    display: flex;
    margin-top: 30px;
    // background: #1e1e21;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    .btn {
      width: 100px;
      height: 100px;
      padding: 30px;
      color: #fff;
      font-size: 25px;
      background-color: transparent;
      outline: none;
      border: none;
      &:hover {
        cursor: url(../assets/pointer.png), pointer;
        // background: #2a2931;
      }
    }
    .volum-control {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      justify-content: flex-start;
      align-items: center;
      &:hover {
        .volume {
          display: block;
        }
      }
    }
    .volume {
      display: none;
      -webkit-app-region: no-drag;
      width: 100px;
      height: 8px;
      margin-left: 5px;
      appearance: none;
      outline: none;
      border-radius: 8px;
      &::-webkit-slider-thumb {
        appearance: none;
        width: 8px;
        background-color: #3071a9cc;
        border: 8px solid #3071a9cc;
        border-radius: 100%;
        cursor: pointer;
      }
    }
  }
}
</style>
