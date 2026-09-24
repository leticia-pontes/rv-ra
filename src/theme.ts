(() => {
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    const report = document.getElementById('capability-report');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const capabilityToggleBtn = document.getElementById('capability-toggle');

    if (themeToggleBtn instanceof HTMLButtonElement) {
        const updateThemeButton = () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
            themeToggleBtn.setAttribute('aria-label', isDark ? 'Ativar modo claro' : 'Ativar modo escuro');
            themeToggleBtn.setAttribute('aria-pressed', String(isDark));
        };

        updateThemeButton();

        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            }

            updateThemeButton();
        });
    }

    if (report instanceof HTMLElement && capabilityToggleBtn instanceof HTMLButtonElement) {
        const updateCapabilityButton = () => {
            const isCollapsed = report.classList.contains('is-collapsed');
            capabilityToggleBtn.textContent = isCollapsed ? '>' : '<';
            capabilityToggleBtn.setAttribute('aria-label', isCollapsed ? 'Expandir painel de capacidades' : 'Recolher painel de capacidades');
            capabilityToggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
        };

        const isCollapsed = localStorage.getItem('capability-panel-collapsed') === 'true';
        report.classList.toggle('is-collapsed', isCollapsed);
        updateCapabilityButton();

        capabilityToggleBtn.addEventListener('click', () => {
            const shouldCollapse = !report.classList.contains('is-collapsed');
            report.classList.toggle('is-collapsed', shouldCollapse);
            localStorage.setItem('capability-panel-collapsed', String(shouldCollapse));
            updateCapabilityButton();
        });
    }
});
