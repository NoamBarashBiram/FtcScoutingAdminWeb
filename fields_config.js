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

function fireKey(str) {
  return str.replace("$", "{dollar}")
            .replace("[", "{bracketS}")
            .replace("]", "{bracketE}")
            .replace("#", "{hash}")
            .replace(".", "{dot}");
}

function unFireKey(str){
  return str.replace("{dollar}",   "$")
            .replace("{bracketS}", "[")
            .replace("{bracketE}", "]")
            .replace("{hash}",     "#")
            .replace("{dot}",      ".");
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

function readConfig(){
  autoFields = [];
  telOpFields = [];

  let valid = true;

  for (autoKey of Object.keys(configSnapshot[auto])){
    if (autoKey != placeholder){
      let autoField = new Field(autoKey, auto, configSnapshot[auto][autoKey]);
      valid = valid &&  autoField.validate();
      autoFields.push(autoField);
    }
  }

  for (telOpKey of Object.keys(configSnapshot[telOp])){
    if (telOpKey != placeholder){
      let telOpField = new Field(telOpKey, telOp, configSnapshot[telOp][telOpKey]);
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
