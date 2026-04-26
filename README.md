# KitchenMotors Web Deploy

Dit is de aparte Vercel deploy-repo voor de frontend.

Belangrijk:
- Live frontend wordt gedeployed vanuit deze map/repo.
- Development gebeurt voorlopig in `C:\Users\Hilai\kitchenmotors\apps\web`.
- Wijzigingen moeten manueel gesynchroniseerd worden naar deze repo voordat ze live gaan.

Na wijzigingen:
```powershell
npm run build
git add .
git commit -m "..."
git push