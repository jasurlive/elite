# Elite House

My house in 3D. Walk through each room in first person, orbit the whole home from outside, or open the 2D floor plan, which is generated from the same data.

<img width="70%" alt="image" src="https://github.com/user-attachments/assets/25ce6e0c-bc03-4bf0-b21d-4741ea5d5695" />

<img width="40%" alt="image" src="https://github.com/user-attachments/assets/aac97055-62c0-4374-81c3-2ace38f7a6e0" />


## Run

```bash
npm install
npm run dev
```

Build for production with `npm run build`.

## Folder structure

```
elite/
├── index.html
├── public/
│   └── favicon.svg
└── src/
    ├── app/            # App.tsx, main.tsx (entry + routes)
    ├── assets/         # elite.jpg (original floor drawing)
    ├── components/
    │   ├── house/      # 3D scene: Scene, Wall, Floor, Opening, Furniture, Camera
    │   ├── Layout.tsx
    │   ├── PlanDrawing.tsx
    │   └── ErrorBoundary.tsx
    ├── css/            # theme, reset, menu, page, home, plan
    ├── hooks/LOCAL/    # useHouse, useShortcuts
    ├── lib/            # plan.ts (walls, doors, rooms), furniture.ts
    ├── pages/          # Home (3D), Plan (2D)
    └── shared/         # Menu.tsx (navbar with all controls)
```

To change the house, edit the data in `src/lib/plan.ts` and `src/lib/furniture.ts`. The 3D view and the plan both read from these files.

## Templates and stack

- Folder structure and navbar come from my template [jasurlive/django-react](https://github.com/jasurlive/django-react) (the `front/` part).
- [Vite](https://vite.dev) + [React](https://react.dev) + TypeScript, with React Compiler
- [Three.js](https://threejs.org) through [React Three Fiber](https://r3f.docs.pmnd.rs) and [drei](https://drei.docs.pmnd.rs)
- [React Router](https://reactrouter.com) and [React Icons](https://react-icons.github.io/react-icons)
- [oxlint](https://oxc.rs) for linting

## License

[GPL-3.0](LICENSE)
