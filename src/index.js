const binaryOperators = {
    '==': 'equality',
    '!=': 'inequality',

    '<': 'lessThan',
    '<=': 'lessThanOrEqual',
    '>': 'greaterThan',
    '>=': 'greaterThanOrEqual',

    '<<': 'shiftLeft',
    '>>': 'shiftRight',
    '>>>': 'unsignedShiftRight',

    '+': 'plus',
    '-': 'minus',
    '*': 'times',
    '/': 'divide',
    '%': 'remainder',
    '**': 'power',

    '|': 'bitwiseOr',
    '^': 'bitwiseXor',
    '&': 'bitwiseAnd',
};

const logicalOperators = {
    '||': 'logicalOr',
    '&&': 'logicalAnd',
};

const unaryOperators = {
    '+': 'unaryPlus',
    '-': 'unaryMinus',

    '!': 'logicalNot',
    '~': 'bitwiseNot',
};

// We don't transform these because we want to preserve their semantics
const prohibitedOperators = [
    'instanceof', 'in', '===', '!==',
    'typeof', '!',
];

const overloadingDirectives = [];

export default function({ types: t }) {
    return {
        visitor: {
            BlockStatement: {
                enter(path) {
                    for (const directive of path.node.directives) {
                        if (directive.value.value === 'use overloading') {
                            overloadingDirectives.push(directive);
                        }
                    }
                },
                exit(path) {
                    for (const directive of path.node.directives) {
                        if (directive.value.value === 'use overloading') {
                            overloadingDirectives.pop();
                        }
                    }
                },
            },

            Program: {
                enter(path) {
                    for (const directive of path.node.directives) {
                        if (directive.value.value === 'use overloading') {
                            overloadingDirectives.push(directive);
                        }
                    }
                },
                exit(path) {
                    for (const directive of path.node.directives) {
                        if (directive.value.value === 'use overloading') {
                            overloadingDirectives.pop();
                        }
                    }
                },
            },

            BinaryExpression(path) {
                if (overloadingDirectives.length === 0) {
                    return;
                }

                const { node } = path;

                if (prohibitedOperators.includes(node.operator)) {
                    return;
                }

                path.replaceWith(
                    t.callExpression(
                        t.memberExpression(
                            t.identifier('Function'),
                            t.memberExpression(
                                t.identifier('Symbol'),
                                t.identifier(binaryOperators[node.operator])
                            ),
                            true
                        ),
                        [node.left, node.right]
                    )
                );
            },

            LogicalExpression(path) {
                if (overloadingDirectives.length === 0) {
                    return;
                }

                const { node } = path;

                path.replaceWith(
                    t.callExpression(
                        t.memberExpression(
                            t.identifier('Function'),
                            t.memberExpression(
                                t.identifier('Symbol'),
                                t.identifier(logicalOperators[node.operator])
                            ),
                            true
                        ),
                        [node.left, node.right]
                    )
                );
            },

            AssignmentExpression(path) {
                if (overloadingDirectives.length === 0) {
                    return;
                }

                const { node } = path;

                if (node.operator === '=') {
                    return;
                }

                const operator = node.operator.replace('=', '');

                path.replaceWith(
                    t.assignmentExpression(
                        '=',
                        node.left,
                        t.callExpression(
                            t.memberExpression(
                                t.identifier('Function'),
                                t.memberExpression(
                                    t.identifier('Symbol'),
                                    t.identifier(binaryOperators[operator])
                                ),
                                true
                            ),
                            [node.left, node.right]
                        )
                    )
                );
            },

            UnaryExpression(path) {
                if (overloadingDirectives.length === 0) {
                    return;
                }

                const { node } = path;

                if (prohibitedOperators.includes(node.operator)) {
                    return;
                }

                path.replaceWith(
                    t.callExpression(
                        t.memberExpression(
                            t.identifier('Function'),
                            t.memberExpression(
                                t.identifier('Symbol'),
                                t.identifier(unaryOperators[node.operator])
                            ),
                            true
                        ),
                        [node.argument]
                    )
                )
            }
        }
    };
};
