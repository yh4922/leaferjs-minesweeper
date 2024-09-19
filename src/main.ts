import './style.css'
import anime from 'animejs'
import Swal from 'sweetalert2'
import generateMinesweeperMap from './genMap'

import { Leafer, Image, Box, PointerEvent } from 'leafer-ui'
import '@leafer-in/state'
import defaultSkin from './skin/default/bg.jpg'
import openSound from './icon/open_sound.svg'
import closeSound from './icon/close_sound.svg'

import boomAudio from './audio/boom.mp3'
import openAudio from './audio/open.mp3'
import markAudio from './audio/mark.mp3'

const soundBtn = document.getElementById('sound_btn') as HTMLButtonElement
const soundBtnImage = document.getElementById('sound_btn_image') as HTMLImageElement

let turnOnSound = parseInt(localStorage.getItem('turnOnSound') || '0')
soundBtnImage.src = turnOnSound ? openSound : closeSound
async function playAudio(type: string) {
  if (!turnOnSound) return
  let audio = new Audio()
  audio.volume = 0.05
  audio.src = type
  audio.play()

  // 只播放2s
  await sleep(2000)
  audio.pause()

  // 释放
  audio.remove()
}

soundBtn.onclick = toggleSound
function toggleSound() {
  turnOnSound = turnOnSound === 1 ? 0 : 1
  localStorage.setItem('turnOnSound', turnOnSound.toString())
  soundBtnImage.src = turnOnSound ? openSound : closeSound
}

function sleep(time: number) {
  return new Promise<void>(resolve => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

let leafer = new Leafer({
  view: 'app', // 支持 window 、div、canvas 标签对象， 可使用id字符串(不用加 # 号)
  width: 800, // 不能设置为 0， 否则会变成自动布局
  height: 800,
  type: "draw"
})

// 全局鼠标状态
let globalPointButtons = -1
let gameOver = false

let grid_count = 20 // 网格数量
let landmine_count = 40 // 地雷数量 不能大于 grid_count * grid_count

// 网格数据
let gridDataMap: number[][];
// 当前鼠标停留的格子
let currentMoveSquare: SquareGrid | null = null
// 所有格子
let squareGridList: SquareGrid[][] = []
// 所有地雷
let landmineList: SquareGrid[] = []
// 空白格子
let blankGridList: SquareGrid[] = []



const grid_count_input = document.getElementById('grid_count') as HTMLInputElement
const grid_count_value = document.getElementById('grid_count_value') as HTMLSpanElement
const landmine_count_input = document.getElementById('landmine_count') as HTMLInputElement
const landmine_count_value = document.getElementById('landmine_count_value') as HTMLSpanElement

// 初始化值
grid_count_input.value = grid_count.toString()
grid_count_value.innerText = grid_count.toString()
landmine_count_input.value = landmine_count.toString()
landmine_count_value.innerText = landmine_count.toString()

grid_count_input.oninput = function () {
  grid_count = parseInt(grid_count_input.value)
  grid_count_value.innerText = grid_count.toString()
  // 限制雷的数量不能大于网格数量
  if (landmine_count > grid_count * grid_count) {
    landmine_count = grid_count * grid_count
  }
  // 设置max
  landmine_count_input.setAttribute('max', landmine_count.toString())
}

landmine_count_input.oninput = function () {
  landmine_count = parseInt(landmine_count_input.value)
  landmine_count_value.innerText = landmine_count.toString()
}

// start_game
const start_game = document.getElementById('start_game') as HTMLButtonElement
start_game.onclick = function () {
  renderGrid()
}

// 渲染初始网格
function renderGrid() {
  // 重置
  gridDataMap = []
  currentMoveSquare = null
  globalPointButtons = -1
  gameOver = false
  landmineList = []
  blankGridList = []

  // 销毁网格
  squareGridList.forEach(item => {
    item.forEach(item => {
      item?.destroy()
    })
  })
  squareGridList = []
  // 初始化数据
  let w = leafer.width!
  let h = leafer.height!

  let grid_width = w / grid_count
  let grid_height = h / grid_count

  gridDataMap = generateMinesweeperMap(grid_count, landmine_count)

  // 生成 gridDataMap 数据  二维数组 
  for (let i = 0; i < grid_count; i++) {
    for (let j = 0; j < grid_count; j++) {
      // 0 标识正常 1标识地雷  随机生成地雷位置 但是不能超过地雷数量
      let isLandmine = gridDataMap[i][j] === -1
      let item = new SquareGrid(grid_width, grid_height, i, j, isLandmine, gridDataMap[i][j])
      leafer.add(item.box)
      squareGridList[i] = squareGridList[i] || []
      squareGridList[i][j] = item

      if (isLandmine) {
        landmineList.push(item)
      } else {
        blankGridList.push(item)
      }
    }
  }
}

class SquareGrid {
  // 尺寸
  width: number
  height: number
  // 盒子
  box: Box
  image: Image
  // 位置
  x: number
  y: number
  key: string
  // 数字
  tipNum: number
  // 地雷
  lei: boolean
  // 左右键的按下状态
  // -1 未按下
  // 1 左键按下
  // 2 右键按下
  // 3 左右键同时按下
  pointButtons: number
  // 状态
  // 0  空白
  // 1  数字
  // 2  数字
  // 3  数字
  // 4  数字
  // 5  数字
  // 6  数字
  // 7  数字
  // 8  数字
  // 9  默认状态
  // 10 插旗
  // 11 问号
  // 12 地雷
  // 13 爆炸
  status: number
  constructor(width: number, height: number, x_num: number, y_num: number, lei = false, tipNum: number) {
    this.key = `${x_num}_${y_num}`
    this.width = width
    this.height = height
    this.x = x_num
    this.y = y_num
    this.lei = lei
    this.tipNum = tipNum

    this.status = 9

    // 左右键的按下状态
    this.pointButtons = -1
    // 盒子
    this.box = new Box({
      x: x_num * width,
      y: y_num * height,
      opacity: 1,
      width: width,
      height: height,
      overflow: 'hide'
    })

    // 2*7的雪碧图
    this.image = new Image({
      url: defaultSkin,
      width: width * 7,
      height: height * 2,
      x: 0,
      y: 0,
    })

    // 默认在9 初始位置
    this.setImage()

    this.box.add(this.image)

    let self = this

    // 鼠标进入
    this.box.on(PointerEvent.OVER, function () {
      if (gameOver) return
      currentMoveSquare = self
      self.box.set({ opacity: 0.9 })

      if (globalPointButtons === 3) {
        self.detection()
      }
    })

    // 鼠标离开
    this.box.on(PointerEvent.OUT, function () {
      if (gameOver) return
      currentMoveSquare = null
      self.box.set({ opacity: 1 })
      // 移出
      self.unDetection() // 取消探测
    })
    const mouseup = () => {
      if (gameOver) return
      self.unDetection() // 取消探测

      // 左键点击打开方块
      if (self.pointButtons === 1) {
        self.openItem()
      }

      else if (self.pointButtons === 2) {
        self.markItem()
      }
    }
    // 鼠标松开
    this.box.on(PointerEvent.UP, mouseup)
  }
  flash() {
    this.box.opacity = 0.5
    anime({
      targets: this.box,
      opacity: 1,
      duration: 20,
      easing: 'linear'
    })
  }
  /**
   * 打开格子
   */
  async openItem() {
    if (gameOver) return
    // 如果当前格子是雷 则游戏结束
    if (this.lei) {
      gameOver = true
      this.boom()
      // 动态爆炸每一颗地雷
      await sleep(20)

      for (let i = 0; i < grid_count; i++) {
        for (let item of landmineList) {
          if (item.key !== this.key && item.y === i) {
            item.boom()
            item.box.opacity = 0.5
          }
        }
        await sleep(20)
      }

      // 所有爆炸执行完毕后 提示游戏结束
      executeGameOver('很遗憾，你输了')
    } else {
      this.status = this.tipNum
      this.setImage()
      playAudio(openAudio)
      this.flash()
      sleep(100).then(() => {
        isGameOver()
      })

      // 如果当前格子是0 则打开周围的8个格子
      if (this.tipNum === 0) {
        let surArr = this.getSur()
        setTimeout(() => {
          surArr.forEach(item => {
            // 存在并且是未打开的格子
            if (item && item.status === 9) {
              item.openItem()
            }
          })
        }, 20)
      }
    }
  }
  /**
   * 爆炸
   */
  boom() {
    this.status = 13
    this.setImage()
    playAudio(boomAudio)
  }
  /**
   * 标记格子
   */
  markItem() {
    if (this.status === 9) {
      this.status = 10
    } else if (this.status === 10) {
      this.status = 11
    } else if (this.status === 11) {
      this.status = 9
    } else {
      return
    }
    playAudio(markAudio)
    this.setImage()
  }
  /**
   * 设置图片
   * @param num 传入值临时改变状态 通过设置status来永久改变状态
   */
  setImage(num?: number) {
    let _num = num ?? this.status

    let x = 0 - (_num % 7) * this.width
    let y = 0 - (_num > 6 ? 1 : 0) * this.height
    this.image.set({
      x: x,
      y: y
    })
  }
  getSur(includeSelf = false) {
    const getItem = (x: number, y: number) => {
      if (squareGridList[x] && squareGridList[x][y]) {
        return squareGridList[x][y]
      } else {
        return null
      }
    }

    let arr = []
    //  第一行
    arr[0] = getItem(this.x - 1, this.y - 1)
    arr[1] = getItem(this.x, this.y - 1)
    arr[2] = getItem(this.x + 1, this.y - 1)
    // 第二行
    arr[3] = getItem(this.x - 1, this.y)
    arr[4] = includeSelf ? getItem(this.x, this.y) : null // 自己
    arr[5] = getItem(this.x + 1, this.y)
    // 第三行
    arr[6] = getItem(this.x - 1, this.y + 1)
    arr[7] = getItem(this.x, this.y + 1)
    arr[8] = getItem(this.x + 1, this.y + 1)

    return arr
  }
  /**
   * 探测周围八个格子
   */
  detection() {
    // 探测周围八个格子
    let itemArr = this.getSur()
    itemArr.forEach(item => {
      if (item && item.status === 9) {
        item.setImage(0)
      }
    })
  }
  /**
   * 取消探测
   */
  unDetection() {
    // 探测周围八个格子
    let itemArr = this.getSur()
    itemArr.forEach(item => {
      item?.setImage()
    })
  }
  /**
   * 销毁
   */
  destroy() {
    this.box.off(PointerEvent.OVER)
    this.box.off(PointerEvent.OUT)
    this.box.off(PointerEvent.UP)
    this.image.destroy()
    this.box.destroy()
  }
}

/**
 * 判断游戏是否结束
 */
function isGameOver() {
  // 已经结束不判断
  if (gameOver) return

  // 游戏结束条件
  // 1. 所有地雷都标记
  // 1.1 插旗的数量
  let flagCount = landmineList.filter(item => item.status === 10).length
  // 1.2 判断插旗的数量等于地雷的数量
  if (flagCount === landmine_count) {
    // 2. 所有非地雷的格子都打开 状态都小于9
    let openCount = blankGridList.filter(item => item.status < 9).length
    if (openCount === grid_count * grid_count - landmine_count) {
      executeGameOver()
      return
    }
  }
}

/**
 * 执行游戏结束
 */
function executeGameOver(msg?: string) {
  gameOver = true

  if (msg) {
    Swal.fire({
      icon: "error",
      title: "很遗憾, 你输了",
    });
  } else {
    Swal.fire({
      icon: "success",
      title: "恭喜你，你赢了",
    });
  }
}

document.addEventListener('mousedown', function (e) {
  if (gameOver) return
  if (currentMoveSquare) {
    if (e.buttons === 1) {
      // console.log('左键按下', currentMoveSquare.x, currentMoveSquare.y, currentMoveSquare.lei)
      globalPointButtons = 1
      currentMoveSquare.pointButtons = 1
    } else if (e.buttons === 2) {
      // console.log('右键按下', currentMoveSquare.x, currentMoveSquare.y, currentMoveSquare.lei)
      globalPointButtons = 2
      currentMoveSquare.pointButtons = 2
    } else if (e.buttons === 3) {
      // console.log('同时按下左右键', currentMoveSquare.x, currentMoveSquare.y, currentMoveSquare.lei)
      globalPointButtons = 3
      currentMoveSquare.pointButtons = 3
      currentMoveSquare.detection()
    }
  }
})

document.addEventListener('mouseup', function () {
  if (gameOver) return
  globalPointButtons = -1
})

renderGrid()