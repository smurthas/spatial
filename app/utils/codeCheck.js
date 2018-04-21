import { parseScript } from 'esprima';

const checkForConstReassigns = (ast, existingDeclarations = {}) => {
  if (ast.body) {
    const declared = { ...existingDeclarations };
    let err;

    const checkAssigmentLeftDeclaredConst = (expr) => {
      const {
        operator,
        left: { name, loc: { start: { line, column } } },
      } = expr;
      if (operator === '=' && declared[name] === 'const') {
        err = {
          description: 'TypeError: const reassign',
          lineNumber: line,
          column: column + 1,
        };
      }
    };
    ast.body.forEach((item) => {
      if (err) {
        return;
      }
      if (item.type === 'VariableDeclaration') {
        item.declarations.forEach(d => {
          declared[d.id.name] = item.kind;
          if (item.kind === 'const' && d.init.body) {
            err = checkForConstReassigns(d.init.body, declared);
          }
        });
      } else if (item.type === 'ExpressionStatement') {
        const { expression } = item;
        if (expression.type === 'AssignmentExpression') {
          checkAssigmentLeftDeclaredConst(expression);
        } else if (expression.type === 'CallExpression') {
          expression.arguments.filter(a => a.type === 'AssignmentExpression')
            .forEach(checkAssigmentLeftDeclaredConst);
        }
      } else if (item.type === 'IfStatement') {
        err = checkForConstReassigns(item.consequent, declared);
        if (!err) {
          err = checkForConstReassigns(item.alternate, declared);
        }
      }
    });

    return err;
  }

  return null;
};


const validateSyntax = (code) => {
  const ast = parseScript(code, { loc: true });
  const constErr = checkForConstReassigns(ast);
  if (constErr) {
    throw constErr;
  }
};

const normalizeErr = err => {
  const e = {
    description: err.toString(),
    lineNumber: err.line,
    column: err.column,
  };
  const isChrome = isNaN(err.line);
  if (isChrome) {
    // Chrome doesn't set value, but stack track has them
    const tickFnStr = err.stack.split('\n')[1];
    const last = tickFnStr.split(' ').slice(-1)[0].slice(0, -1);
    const [lineStr, columnStr] = last.split(':').slice(1, 3);
    e.lineNumber = parseInt(lineStr, 10) - 3;
    e.column = parseInt(columnStr, 10);
  } else {
    const isIncorrectLineCol = err instanceof ReferenceError && err.message === 'Cannot access uninitialized variable.';
    if (isIncorrectLineCol) {
      // Safari incorrectly sets the values of line and column for TypeErrors when
      // reassigning consts - WTF?
      delete e.lineNumber;
      delete e.column;
    } else {
      // Safari for all other error
      e.lineNumber -= 2;
      e.column -= 1;
    }
  }

  return e;
};


export {
  validateSyntax,
  normalizeErr,
};
