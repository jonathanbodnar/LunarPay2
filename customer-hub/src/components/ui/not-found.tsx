import React from "react";

type NotFoundProps = {
    extraInfo?: string
}

const NotFound: React.FC<NotFoundProps> = ({ extraInfo }) => {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                width: "100vw",
                fontSize: "1.5rem",
                color: "#555",
                textAlign: "center",
                flexDirection: "column",
            }}
        >
            <div>
                Page not found
            </div>
            
            <div style={{ marginTop: "1rem" }}>
                {extraInfo && <>{extraInfo}</>}
            </div>
        </div>
    );
};

export default NotFound;
