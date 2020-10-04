const auto = "Autonomous",
    telOp = "TelOp",
    placeholder = "PLACEHOLDER_DO_NOT_TOUCH",
    placeholderChildren = {
        placeholder: ""
    },
    placeholderAll = {
        auto:  placeholderChildren,
        telOp: placeholderChildren
    };

const entries = "entries",
    max =       "max",
    min =       "min",
    score =     "score";

const Type = {
    INTEGER: "int",
    STRING:  "str",
    CHOICE:  "cho",
    TITLE:   "tit",
    BOOLEAN: "bool",
    UNKNOWN: "???"
};

const longTypes = {
  int: "Integer",
  str: "String",
  cho: "Choice",
  tit: "Title",
  bool: "Boolean",
  "???": "Unknown"
};

function fireKey(str) {
  return str.replaceAll("{", "{curlBracS}")
            .replaceAll("$", "{dollar}")
            .replaceAll("[", "{bracketS}")
            .replaceAll("]", "{bracketE}")
            .replaceAll("#", "{hash}")
            .replaceAll(".", "{dot}");
}

function unFireKey(str){
  return str.replaceAll("{dollar}",    "$")
            .replaceAll("{bracketS}",  "[")
            .replaceAll("{bracketE}",  "]")
            .replaceAll("{hash}",      "#")
            .replaceAll("{dot}",       ".")
            .replaceAll("{curlBracS}", "{");
}

autoFields = [];
telOpFields = [];

function getField(name, kind){

  if (kind == auto){
    return getAutoField(name);
  } else if (kind == telOp){
    return getTelOpField(name);
  }
  return null;
}

function getAutoField(name){
  for (field of autoFields){
    if (field.attrs.name == name){
      return field;
    }
  }
  return null;
}

function getTelOpField(name){
  for (field of telOpFields){
    if (field.attrs.name == name){
      return field;
    }
  }
  return null;
}

function getNewValue(field, matches, lastValue){
  if (matches == undefined){
    switch (field.type) {
      case Type.INTEGER:
        return field.attrs.min;
      case Type.CHOICE:
      case Type.BOOLEAN:
        return 0;
      default:
        return "";
    }
  }
  arr = [];
  let defVal = getNewValue(field);
  let pitVal = defVal;
  if (lastValue != undefined){
    arr = lastValue.split(";");
    pitVal = arr.pop();
  }
  while (arr.length > matches - 1){
    arr.pop();
  }
  while (arr.length < matches - 1){
    arr.push(defVal);
  }
  arr.push(pitVal);
  return arr.join(";");
}

function getNewConfig(matches, lastValues){
  let config = {}
  config[auto] = {}
  for (field of autoFields){
    if (field.type != Type.TITLE){
      let lastValue = undefined;
      if (lastValues != undefined && lastValues[auto]){
        lastValue = lastValues[auto][field.attrs.name]
      }
      config[auto][field.attrs.name] = getNewValue(field, matches, lastValue);
    }
  }

  config[telOp] = {}
  for (field of telOpFields){
    if (field.type != Type.TITLE){
      let lastValue = undefined;
      if (lastValues != undefined && lastValues[telOp]){
        lastValue = lastValues[telOp][field.attrs.name]
      }
      config[telOp][field.attrs.name] = getNewValue(field, matches, lastValue);
    }
  }

  return config;
}


function readConfig(){
  autoFields = [];
  telOpFields = [];
  configCache = {}

  let valid = true;
  let i = 0;
  for (let autoIndex of Object.keys(configSnapshot[auto])){
    if (autoIndex != placeholder){
      if (autoIndex != i.toString()){
        valid = false;
        let i2 = i;
        while (Object.keys(configSnapshot[auto]).includes(i2.toString())){
          i2++;
        }
        configSnapshot[auto][i2] = configSnapshot[auto][autoIndex];
        configSnapshot[auto][autoIndex] = null;
        autoIndex = i2;
      }
      let autoField = new Field(autoIndex, auto, configSnapshot[auto][autoIndex]);
      valid = valid && autoField.validate();
      autoFields.push(autoField);
      i++;
    }
  }

  i = 0;
  for (let telOpIndex of Object.keys(configSnapshot[telOp])){
    if (telOpIndex != placeholder){
      let telOpField = new Field(telOpIndex, telOp, configSnapshot[telOp][telOpIndex]);
      valid = valid && telOpField.validate();
      telOpFields.push(telOpField);
    }
  }

  console.log("Config is " + (valid ? "Valid" : "Invalid"));
  return valid;
}

class Field {
  constructor(index, kind, attrs){
    this.kind = kind;
    this.index = index;
    let type = attrs.type;
    if (!Object.values(Type).includes(type)){
      this.type = Type.UNKNOWN;
    } else {
      this.type = type;
    }
    this.attrs = attrs
  }

  validate(){
    let valid = true;
    if (typeof this.attrs.name != "string"){
      console.error("Invalid Name");
      valid = false;
      this.attrs.name = configSnapshot[this.kind][this.index].name = "No Name Found";
    }
    if (this.type == Type.UNKNOWN || this.type == undefined){
      console.error("Invalid Type");
      valid = false;
      this.type = configSnapshot[this.kind][this.index].type = Type.STRING;
    } else if (this.type == Type.INTEGER){
      if (this.attrs.min == undefined){
        console.error("No Minimum");
        valid = false;
        this.attrs.min = configSnapshot[this.kind][this.index].min = 0;
      } else {
        this.attrs.min = parseInt(this.attrs.min)
        if (isNaN(this.attrs.min)){
          console.error("Invalid Minimum");
          valid = false;
          this.attrs.min = configSnapshot[this.kind][this.index].min = 0;
        }
      }

      if (this.attrs.max == undefined){
        console.error("No Maximum");
        valid = false;
        this.attrs.max = configSnapshot[this.kind][this.index].max = this.attrs.min + 1;
      } else {
        this.attrs.max = parseInt(this.attrs.max);
        if (isNaN(this.attrs.max) || this.attrs.max <= this.attrs.min){
          console.error("Invalid Maximum");
          valid = false;
          this.attrs.max = configSnapshot[this.kind][this.index].max = this.attrs.min + 1;
        }
      }
    } else if (this.type == Type.CHOICE){
      if (typeof this.attrs.entries != "string"){
        console.error("No Entries");
        valid = false;
        this.attrs.entries = configSnapshot[this.kind][this.index].entries =  "No,Entries,Found";
      }
    }

    if ([Type.INTEGER, Type.BOOLEAN].includes(this.type)){
      if (this.attrs.score == undefined){
        console.error("No Score");
        valid = false;
        this.attrs.score = configSnapshot[this.kind][this.index].score = 0;
      } else {
        this.attrs.score = parseInt(this.attrs.score);
        if (isNaN(this.attrs.score) || this.attrs.score < 0){
          console.error("Invalid Score");
          valid = false;
          this.attrs.score = configSnapshot[this.kind][this.index].score = 0;
        }
      }
    }

    return valid;
  }
}

function stringify(field){
  let str = "";
  switch (field.type) {
    case Type.INTEGER:
      str += ", Min: " + field.attrs.min;
      str += ", Max: " + field.attrs.max;
    case Type.BOOLEAN:
      str += ", Score: " + field.attrs.score;
      break;
    case Type.CHOICE:
      str += ", Entries: " + field.attrs.entries;
      break;
  }
  return str;
}

function remove(array, element){
  let index = array.indexOf(element);
  if (index != -1){
    array.splice(index, 1);
    return array;
  }
  return array;
}

function validate(value, field, matches){
  let valid = true,
    fieldEntries = field.type == Type.CHOICE ?
      field.attrs.entries.split(",").length - 1 : 0;
  value = value.split(";");

  if (field.type == Type.INTEGER){
    for (let val in value){
      value[val] = parseInt(value[val]);
      if (value[val] > field.attrs.max){
        value[val] = field.attrs.max;
        valid = false;
      } else if (value[val] < field.attrs.min || isNaN(value[val])){
        value[val] = field.attrs.min;
        valid = false;
      }
    }
  } else if (field.type == Type.CHOICE){
    for (let val in value){
      value[val] = parseInt(value[val]);
      if (isNaN(value[val]) || value[val] > fieldEntries || value[val] < 0){
        value[val] = 0;
        valid = false;
      }
    }
  } else if (field.type == Type.BOOLEAN){
    for (let val in value){
      if (!["0", "1"].includes(value[val])){
        value[val] = "0"
      }
    }
  }

  if (valid && value.length != matches){
    valid = false;
  }

  return valid ? undefined : value.join(";");
}

function repair() {
  let valid = true;
  for (event of Object.keys(eventsSnapshot)){
    for (team of Object.keys(eventsSnapshot[event])){
      let localAutos = [], localTelOps = [];

      let matches = eventsSnapshot[event][team].matches;
      if (matches == undefined || ! (typeof matches == "string")){
        matches = "Scouting Pit";
        valid = false;
        eventsSnapshot[event][team].matches = matches;
      }

      matches = matches.split(";").length;

      if (eventsSnapshot[event][team][auto] != undefined){
        for (let autoField of Object.keys(eventsSnapshot[event][team][auto])){
          localAutos.push(autoField);
        }
      } else {
        valid = false;
        eventsSnapshot[event][team][auto] = {};
      }

      if (eventsSnapshot[event][team][telOp] != undefined){
        for (let telOpField of Object.keys(eventsSnapshot[event][team][telOp])){
          localTelOps.push(telOpField);
        }
      } else {
        valid = false;
        eventsSnapshot[event][team][telOp] = {};
      }

      for (let autoField of autoFields){
        if (autoField.type == Type.TITLE){
          continue;
        }
        let lastValue = undefined;
        if (!localAutos.includes(autoField.attrs.name)){
            valid = false;
        } else {
          localAutos = remove(localAutos, autoField.attrs.name);
          let validVal = validate(eventsSnapshot[event][team][auto][autoField.attrs.name], autoField, matches);
          if (validVal != undefined){
            valid = false;
            lastValue = validVal;
          } else {
            continue;
          }
        }
        eventsSnapshot[event][team][auto][autoField.attrs.name] = getNewValue(autoField, matches, lastValue);
      }

      if (localAutos.length != 0){
        valid = false;
        for (autoField of localAutos){
          eventsSnapshot[event][team][auto][autoField] = null;
        }
      }

      for (let telOpField of telOpFields){
        if (telOpField.type == Type.TITLE){
          continue;
        }
        let lastValue = undefined;
        if (!localTelOps.includes(telOpField.attrs.name)){
            valid = false;
        } else {
          localTelOps = remove(localTelOps, telOpField.attrs.name);
          let validVal = validate(eventsSnapshot[event][team][telOp][telOpField.attrs.name], telOpField, matches);
          if (validVal != undefined){
            valid = false;
            lastValue = validVal;
          } else {
            continue;
          }
        }
        eventsSnapshot[event][team][telOp][telOpField.attrs.name] = getNewValue(telOpField, matches, lastValue);
      }

      if (localTelOps.length != 0){
        valid = false;
        for (telOpField of localTelOps){
          eventsSnapshot[event][team][telOp][telOpField] = null;
        }
      }
    }
  }

  if (!valid){
    console.log("Invalidation Detected.");
    console.log(eventsSnapshot);
    refernce.child("Events").update(eventsSnapshot);
  }
}
