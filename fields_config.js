const auto = "Autonomous",
    telOp = "TelOp",
    penalty = "Penalty",
    placeholder = "PLACEHOLDER_DO_NOT_TOUCH",
    placeholderChildren = {},
    placeholderAll = {},
    fieldKinds = [auto, telOp, penalty];

placeholderChildren[placeholder] = "";
placeholderAll[auto] = placeholderAll[telOp] = placeholderAll[penalty] = placeholderChildren;

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

var autoFields, telOpFields, penaltyFields;

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

function getFields(kind){
  switch (kind){
    case auto:
      return autoFields;
    case telOp:
      return telOpFields;
    case penalty:
      return penaltyFields;
  }
  return null;
}

function getFieldByIndex(kind, index){
  return getFields(kind)[index];
}

function getField(kind, name) {
  if (kind == auto) {
    return getAutoField(name);
  } else if (kind == telOp) {
    return getTelOpField(name);
  } else if (kind == penalty) {
    return getPenaltyField(name);
  }
  return null;
}

function getFieldsNoKind(name){
  let fields = [];
  let field = getAutoField(name);
  if (field != null){
    fields.push(field);
  }
  field = getTelOpField(name);
  if (field != null){
    fields.push(field);
  }
  field = getPenaltyField(name);
  field = getTelOpField(name);
  if (field != null){
    fields.push(field);
  }
  return fields;
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

function getPenaltyField(name){
  for (field of penaltyFields){
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

  if (matches == 0) return "";

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
  penaltyFields = [];

  let valid = true;
  let i;

  for (kind of fieldKinds) {
    if (!Object.keys(configSnapshot).includes(kind)){
      configSnapshot[kind] = placeholderChildren;
      valid = false;
    }
    i = 0;
    for (let index of Object.keys(configSnapshot[kind])){
      if (index != placeholder){
        if (index != i.toString()){
          valid = false;
          let i2 = i;
          while (Object.keys(configSnapshot[kind]).includes(i2.toString())){
            i2++;
          }
          configSnapshot[kind][i2] = configSnapshot[kind][index];
          configSnapshot[kind][index] = null;
          index = i2;
        }
        let field = new Field(index, kind, configSnapshot[kind][index]);
        getFields(kind).push(field);
        i++;
      }
    }

    for (let field of getFields(kind)){
      valid = field.validate() && valid;
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

    if (this.attrs.dependency == undefined || !["_", "!", undefined].includes(this.attrs.dependency[0])){
      console.error("Invalid Dependency");
      valid = false;
      this.attrs.dependency = configSnapshot[this.kind][this.index].dependency = "";
    } else {
      let dependencyName = this.attrs.dependency.slice(1);
      let dependsOn = getField(this.kind, dependencyName);
      if (dependencyName != "" && (dependsOn == null || dependsOn.type != Type.BOOLEAN)){
        console.error("Invalid Dependency");
        valid = false;
        this.attrs.dependency = configSnapshot[this.kind][this.index].dependency = "";
      }
    }


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

      if (this.attrs.step == undefined){
        console.error("No Step");
        valid = false;
        this.attrs.step = configSnapshot[this.kind][this.index].step = 1;
      } else {
        this.attrs.step = parseInt(this.attrs.step);
        if (isNaN(this.attrs.step) || this.attrs.step == 0 || this.attrs.step > (this.attrs.max - this.attrs.min)){
          console.error("Invalid Score");
          valid = false;
          this.attrs.step = configSnapshot[this.kind][this.index].step = this.attrs.max - this.attrs.min;
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
        if (isNaN(this.attrs.score)){
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

  if (matches == 0) {
    if (value.length == 1 && value[0] == ""){
      return undefined;
    } else {
      return "";
    }
  }

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
      if (typeof eventsSnapshot[event][team] != "object"){
        eventsSnapshot[event][team] = {};
        valid = false;
      }

      let matches = eventsSnapshot[event][team].matches;
      if (matches == undefined || ! (typeof matches == "string")){
        matches = "Scouting Pit";
        valid = false;
        eventsSnapshot[event][team].matches = matches;
      }

      matches = matches.split(";");
      matches = matches.length == 1 && matches[0] == "" ? 0 : matches.length

      for (kind of fieldKinds) {
        let localFields = [];
        if (eventsSnapshot[event][team][kind] != undefined){
          for (let field of Object.keys(eventsSnapshot[event][team][kind])){
            localFields.push(field);
          }
        } else {
          valid = false;
          eventsSnapshot[event][team][kind] = {};
        }

        for (let field of getFields(kind)){
          if (field.type == Type.TITLE){
            continue;
          }
          let lastValue = undefined;
          if (!localFields.includes(field.attrs.name)){
              valid = false;
          } else {
            localFields = remove(localFields, field.attrs.name);
            let validVal = validate(eventsSnapshot[event][team][kind][field.attrs.name].toString(), field, matches);
            if (validVal != undefined){
              valid = false;
              lastValue = validVal;
            } else {
              continue;
            }
          }
          eventsSnapshot[event][team][kind][field.attrs.name] = getNewValue(field, matches, lastValue);
        }

        if (eventsSnapshot[event][team].unplayed == undefined){
          eventsSnapshot[event][team].unplayed = "";
          valid = false;
        }

        if (localFields.length != 0){
          valid = false;
          for (let field of localFields){
            eventsSnapshot[event][team][kind][field] = null;
          }
        }
      }
    }
  }

  if (!valid){
    console.log("Invalidation Detected.");
    refernce.child("Events").update(eventsSnapshot);
  }
}

function swap(kind, index1, index2){
  let field1 = configSnapshot[kind][index1];
  configSnapshot[kind][index1] = configSnapshot[kind][index2];
  configSnapshot[kind][index2] = field1;
  refernce.child("config").update(configSnapshot);
}

function moveUp(kind, index){
  if (index != 0){
    swap(kind, index, index - 1);
  } else {
    throw "Cannot move index 0 up";
  }
}

function moveDown(kind, index){
  let len = kind == auto ? autoFields.length : telOpFields.length;
  if (index < len - 1){
    swap(kind, index, index + 1);
  } else {
    throw "Cannot move index 0 up";
  }
}
