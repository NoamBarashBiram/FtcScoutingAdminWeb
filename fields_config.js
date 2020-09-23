const auto = "Autonomous",
    telOp = "TelOp",
    placeholder = "PLACEHOLDER_DO_NOT_TOUCH",
    placeholderChildren = {placeholder: ""},
    placeholderAll = {auto: placeholderChildren, telOp: placeholderChildren};

const entries = "entries",
    max = "max",
    min = "min",
    score = "score";

const Type = {
    INTEGER: "int",
    STRING:  "str",
    CHOICE:  "cho",
    TITLE:   "tit",
    BOOLEAN: "bool",
    UNKNOWN: "???"
};

class Field {
  constructor(name, type, attrs){
    this.name = name;
    if (!Object.values(Type).includes(type)){
      this.type = Type.UNKNOWN;
    } else {
      this.type = type;
    }
    this.attrs = attrs
  }
}

let f = new Field();
