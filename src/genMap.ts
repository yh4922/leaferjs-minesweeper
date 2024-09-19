/**
 * 生成扫雷地图
 * @param {*} size 地图大小
 * @param {*} num 雷的数量
 * @returns 
 */
export default function generateMinesweeperMap(size: number, num: number): number[][] {
  // 判断地图大小
  if (num > size * size) {
    throw new Error('The number of thunder cannot be greater than the size of the map.')
  }

  // 基础地图
  let map = [];

  //填充基础地图
  for (let i = 0; i < size; i++) {
    let row = [];
    for (let j = 0; j < size; j++) {
      row.push(0);
    }
    map.push(row);
  }

  // 循环插入地雷
  while (num > 0) {

    let x = Math.round(Math.random() * (size - 1));
    let y = Math.round(Math.random() * (size - 1));

    if (map[x][y] !== -1) {
      // console.log('设置地雷', num, x, y)
      map[x][y] = -1;
      num--

      // 对周边的地雷数量进行计算
      // 通过try catch 捕获越界异常
      // 第一行
      try { if (map[x - 1][y - 1] !== -1) map[x - 1][y - 1]++; } catch (e) { } // 第一行 1号
      try { if (map[x - 1][y] !== -1) map[x - 1][y]++; } catch (e) { } // 第一行 2号
      try { if (map[x - 1][y + 1] !== -1) map[x - 1][y + 1]++; } catch (e) { } // 第一行 3号
      //第二行
      try { if (map[x][y - 1] !== -1) map[x][y - 1]++; } catch (e) { } // 第二行 1号
      try { if (map[x][y + 1] !== -1) map[x][y + 1]++; } catch (e) { } // 第二行 3号
      // 第三行
      try { if (map[x + 1][y - 1] !== -1) map[x + 1][y - 1]++; } catch (e) { } // 第三行 1号
      try { if (map[x + 1][y] !== -1) map[x + 1][y]++; } catch (e) { } // 第三行 2号
      try { if (map[x + 1][y + 1] !== -1) map[x + 1][y + 1]++; } catch (e) { } // 第三行 3号
    }
  }

  // 对返回的地图长度进行截取
  return map.map(row => row.splice(0, size))
}