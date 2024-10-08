import { css } from '@emotion/css';

const Leaf = ({ attributes, children, leaf }) => {

    const { text, ...rest } = leaf;

    // console.log("cc", leaf.bold, leaf.code, attributes, type)

    if (leaf.bold) {
        children = <strong>{children}</strong>;
    }

    if (leaf.code) {
        children = (
            <code
                style={{
                    backgroundColor: "#eee",
                    padding: "2px 4px",
                    borderRadius: "4px",
                }}
            >
                {children}
            </code>
        );
    }

    if (leaf.italic) {
        children = <em>{children}</em>;
    }

    if (leaf.strike) {
        children = <del>{children}</del>;
    }

    if (children?.props?.parent?.type === "code-line") {
        return (
            <span {...attributes} className={Object.keys(rest).join(' ')}>
                {children}
            </span>
        );
    }

    return <span className={
        leaf.text === ''
            ? css`
              padding-left: 0.1px;
            `
            : null
    } {...attributes}>{children}</span>;
};

export default Leaf;