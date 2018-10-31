const map = []

const storageLocal = localStorage

export class StorageBuilder {
  constructor (name, index, schema, opt = {}) {
    const self = this
    self.storage = null
    if (typeof name === 'object') {
      throw new Error(`param name required string, but got ${name}`)
    } else if (typeof index === 'object') {
      self.keyIndex = name
      self.schema = index
      index = undefined
    } else {
      self.keyIndex = `${name}.${index}`
      self.schema = schema
    }
    self.keyIndex = `${location.pathname}/${self.keyIndex}`
    if (/[.$]/.test(self.keyIndex)) {
      throw new Error('name or index can\'t include character [.,$]')
    } else if (map.indexOf(self.keyIndex) > -1) {
      throw new Error(`pair name:index[${name}:${index}] already exits in storage, please change other key`)
    } else {
      map.push(self.keyIndex)
    }
    self.build()
  }

  build (keyIndex, schema) {
    const self = this
    const storage = {}

    keyIndex = keyIndex || self.keyIndex
    schema = schema || self.schema

    // getter setter 函数
    function defineJsonProperty (key, storageIndex, storageValue) {
      Object.defineProperty(storage, key, {
        get () {
          return storage[`$$${key}`]
        },
        set (value) {
          storage[`$$${key}`] = JSON.parse(JSON.stringify(value))
          storageLocal.setItem(storageIndex, JSON.stringify(value))
        }
      })
    }

    // 根据类型生成getter, setter
    Object.keys(schema).forEach((key) => {
      const storageIndex = `${keyIndex}.${key}`
      const storageValue = storageLocal.getItem(storageIndex)
      switch (schema[key]) {
        case Boolean:
          storage[`$$${key}`] = JSON.parse(storageValue || 'false')
          defineJsonProperty(key, storageIndex, storageValue)
          break
        case Array:
          storage[`$$${key}`] = JSON.parse(storageValue || '[]')
          defineJsonProperty(key, storageIndex, storageValue)
          break
        case Object:
        case JSON:
          storage[`$$${key}`] = JSON.parse(storageValue || '{}')
          defineJsonProperty(key, storageIndex, storageValue)
          break
        default:
          storage[`$$${key}`] = storageValue
          Object.defineProperty(storage, key, {
            get () {
              return storage[`$$${key}`]
            },
            set (value) {
              storage[`$$${key}`] = value
              storageLocal.setItem(storageIndex, value)
            }
          })
          break
      }
    })

    storage.$schema = schema
    storage.$clear = self.$clear.bind(self)

    self.storage = storage
  }

  $clear (key) {
    const self = this
    if (typeof key === 'string') {
      const keyType = self.schema[key]
      const storageIndex = `${self.keyIndex}.${key}`
      const defaultValue = (() => {
        switch (keyType) {
          case Boolean:
            return false
          case Array:
            return []
          case Object:
          case JSON:
            return {}
          default:
            return undefined
        }
      })()
      self.storage[`$$${key}`] = defaultValue
      storageLocal.removeItem(storageIndex)
    } else if (key === true) {
      Object.keys(self.schema).forEach((key) => {
        const storageIndex = `${self.keyIndex}.${key}`
        localStorage.removeItem(storageIndex)
      })
      self.storage = {}
    }
  }
}
