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

class Field {
  constructor(index, kind, attrs){
    this.kind = kind;
    this.index;
    let type = attrs.type;
    if (!Object.values(Type).includes(type)){
      this.type = Type.UNKNOWN;
    } else {
      this.type = type;
    }
    this.attrs = attrs
  }

  validate(){
    valid = true;
    if (typeof attrs.name != "string"){
      valid = false;
      attrs.name = configSnapshot[this.kind][this.index].name = "No Name Found";
    }
    if (this.type == Type.UNKNOWN){
      valid = false;
      this.type = configSnapshot[this.kind][this.index].type = Type.STRING;
    } else if (this.type == Type.INTEGER){
      if (attrs.min == undefined){
        valid = false;
        attrs.min = configSnapshot[this.kind][this.index].min = 0;
      } else {
        attrs.min = parseInt(attrs.min);
        if (isNaN(attrs.min)){
          valid = false;
          attrs.min = configSnapshot[this.kind][this.index].min = 0;
        }
      }

      if (attrs.max == undefined){
        valid = false;
        attr.max = configSnapshot[this.kind][this.index].max = attrs.min + 1;
      } else {
        attrs.max = parseInt(attrs.max);
        if (isNaN(attrs.max) || attrs.max <= attrs.min){
          valid = false;
          attr.max = configSnapshot[this.kind][this.index].max = attrs.min + 1;
        }
      }
    } else if (this.type == Type.CHOICE){
      if (typeof attrs.entries != "string"){
        valid = false;
        attr.entries = configSnapshot[this.kind][this.index].entries = "No,Entries,Found";
      }
    }

  }
}
