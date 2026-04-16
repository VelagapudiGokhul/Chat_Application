const InitialChat = () => {
    return (
        <section className="flex-1 flex flex-col bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(25,28,30,0.04)] overflow-hidden items-center justify-center p-5">
            <div className="text-center" style={{ maxWidth: '30rem' }}>
                <div className="flex justify-center mb-6">
                    <div className="flex items-center justify-center bg-primary/10 rounded-2xl w-20 h-20 animate-bounce">
                        <span className="material-symbols-outlined font-bold text-[40px] text-primary" data-icon="chat">chat</span>
                    </div>
                </div>
                <h2 className="text-3xl font-headline font-bold text-on-surface mb-3">Welcome to TChatter</h2>
                <p className="text-on-surface-variant font-medium text-lg leading-relaxed">
                    Select a contact from the sidebar to view blueprints, discuss projects, and collaborate with your team.
                </p>
            </div>
        </section>
    );
};

export default InitialChat;
