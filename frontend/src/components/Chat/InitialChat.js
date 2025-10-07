import { MessageSquare } from "lucide-react";

const InitialChat = () => {
  return (
    <div
      className="w-100 h-100 d-flex flex-column align-items-center justify-content-center p-5"
      style={{ backgroundImage: "url('/pBackground.png')", height: "100%" }}

    >
      <div className="text-center" style={{ maxWidth: '30rem' }}>
        <div className="d-flex justify-content-center mb-4">
          <div className="position-relative">
            <div
              className="d-flex align-items-center justify-content-center" 
              style={{
                width: '4rem',
                height: '4rem',
                borderRadius: '1rem',
                backgroundColor: 'rgba(0, 123, 255, 0.1)', 
                animation: 'bounce 1s infinite',
              }}
            >
              <MessageSquare className="w-50 h-50 text-primary" />
            </div>
          </div>
        </div>
        <h2 className="h3 fw-bold">Welcome to tChatter!</h2>
        <p className="text-muted">
          Connect, Chatter n Grow!
        </p>
      </div>
    </div>
  );
};


export default InitialChat;
