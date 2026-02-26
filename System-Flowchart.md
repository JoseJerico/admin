# Multi-Role PWA System Flowchart

```mermaid
graph TD
    A["🚀 Application Starts"] --> B["Register Service Worker<br/>PWA Setup"]
    B --> C{"Existing<br/>Session?"}
    
    C -->|No| D["📱 Login Screen"]
    D --> E["Enter Email & Password"]
    E --> F["Authenticate with Supabase"]
    F --> G{"Login<br/>Successful?"}
    
    G -->|No| D
    G -->|Yes| H["Set User Data"]
    
    C -->|Yes| H
    H --> I["Role Selector"]
    I --> J["Select Access Level"]
    
    J --> K{"Admin<br/>Access?"}
    K -->|Yes| L["Enter Admin PIN"]
    L --> M{"PIN<br/>Correct?"}
    M -->|No| L
    M -->|Yes| N["Admin Role Unlocked"]
    N --> O["Select Admin Role"]
    
    K -->|No| P["Select User or<br/>Technician Role"]
    O --> Q{"Role<br/>Selected"}
    P --> Q
    
    Q -->|Admin| R["🔑 Admin App"]
    Q -->|Technician| S["🔧 Technician App"]
    Q -->|User| T["👤 User App"]
    
    R --> R1["Manage Schedules"]
    R --> R2["Manage Technicians"]
    R --> R3["View Reports"]
    
    S --> S1["View Assigned Jobs"]
    S --> S2["Update Job Status"]
    S --> S3["Camera Integration"]
    
    T --> T1["Browse Services"]
    T --> T2["Book Appointments"]
    T --> T3["Edit Appointments"]
    T --> T4["Install PWA"]
    
    R1 --> U{"User<br/>Action"}
    R2 --> U
    R3 --> U
    S1 --> U
    S2 --> U
    S3 --> U
    T1 --> U
    T2 --> U
    T3 --> U
    T4 --> U
    
    U -->|Logout| V["Clear Local Storage<br/>End Session"]
    U -->|Continue| U
    
    V --> D
    
    style A fill:#667eea,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#3b82f6,stroke:#333,stroke-width:2px,color:#fff
    style I fill:#f59e0b,stroke:#333,stroke-width:2px,color:#fff
    style R fill:#667eea,stroke:#333,stroke-width:2px,color:#fff
    style S fill:#3b82f6,stroke:#333,stroke-width:2px,color:#fff
    style T fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style V fill:#ef4444,stroke:#333,stroke-width:2px,color:#fff
```

## How to Use This Flowchart

1. **View in VS Code**: Open this file in VS Code with the Markdown Preview extension
2. **Online viewers**: Copy the diagram code and paste it at:
   - https://mermaid.live/
   - https://www.mermaidchart.com/
3. **Export as image**: Use Mermaid Live to export as PNG or SVG
