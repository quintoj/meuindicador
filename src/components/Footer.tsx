const Footer = () => {
    const currentYear = new Date().getFullYear();
    const version = import.meta.env.VITE_APP_VERSION || '1.0.0';

    return (
        <footer className="w-full border-t bg-background py-4 mt-auto">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                    <p>
                        © {currentYear} Meu Indicador. Todos os direitos reservados.
                    </p>
                    <p className="text-xs">
                        Versão {version}
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
