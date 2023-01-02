const fs = require('fs')

const DATA_DIR = 'data'

class Storage {
  constructor () {
    if (!fs.existsSync(DATA_DIR)) {
      console.log('Creating data directory', DATA_DIR, '\n')
      fs.mkdirSync(DATA_DIR)
    }

    return this
  }

  async getStorage (name) {
    const filePath = DATA_DIR + '/' + name + '.json'
    if (!fs.existsSync(filePath)) {
      return null
    }

    const data = require(filePath)
    return data
  }

  async saveStorage (name, data) {
    const filePath = DATA_DIR + '/' + name + '.json'
    await fs.writeFile(filePath, JSON.stringify(data))
  }
}

module.exports = Storage
