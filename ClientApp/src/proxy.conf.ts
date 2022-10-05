const PROXY_CONFIG = [
    {
        context: [
            "/api",
        ],
        target: "http://localhost:9001",
        secure: false
    }
]

export default  PROXY_CONFIG;