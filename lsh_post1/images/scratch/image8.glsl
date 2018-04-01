#define FULL_SCREEN 0

#if FULL_SCREEN

#define W 1440.0
#define H 900.0

#else

#define W 640.0
#define H 480.0

#endif

float pix1;

uint m_w = 123456789u;
uint m_z = 987654321u;
uint mask = 0xffffffffu;

void seed(uint i) {
    m_w = i;
    m_z = 987654321u;
}

float random()
{
    m_z = (36969u * (m_z & 65535u) + (m_z >> 16u)) & mask;
    m_w = (18000u * (m_w & 65535u) + (m_w >> 16u)) & mask;
    float result = float(((m_z << 16u) + m_w) & mask);
    return (result / 4294967296.0) + 0.5;
}

vec4 inCircleBackground() {
    return vec4(0.9, 1.0, 0.9, 1);
}

vec4 addDot(vec4 color, vec2 ab, vec2 center, float radius, vec4 dotColor) {
    vec2 dotDiff = ab - center;
    float dotR = sqrt(dotDiff.x * dotDiff.x + dotDiff.y * dotDiff.y);
    float inDot = smoothstep(-pix1/1.0, pix1/1.0, radius - dotR);
    return inDot * dotColor + (1.0 - inDot) * color;
}

vec4 addRing(vec4 color, vec2 ab, vec2 center, float innerR, float outerR, vec4 ringColor) {
    
    vec2 diff = ab - center;
    float centerDist = sqrt(diff.x * diff.x + diff.y * diff.y);
    
    float midR = 0.5 * innerR + 0.5 * outerR;
    
    if (centerDist > midR) {
        
        float outOfRing = smoothstep(-pix1, pix1, centerDist - outerR);
        return vec4(1) * outOfRing + ringColor * (1.0 - outOfRing);
        
    } else {
        
        float inRing = smoothstep(-pix1, pix1, innerR - centerDist);
        return color * inRing + ringColor * (1.0 - inRing);
        
    }
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / iResolution.xy;
    
    float size = min(iResolution.x, iResolution.y);
    
    vec2 ab = fragCoord / size - iResolution.xy / size / 2.0;
    
    float pix10 = 10.0 / size;
    pix1 = 1.0 / size;
    
    
    vec4 color = inCircleBackground();
    color = addDot(color, ab, vec2(0.1, -0.2), 15.0 * pix1, vec4(1, 1, 1, 1));
    color = addDot(color, ab, vec2(0.1, -0.2), 10.0 * pix1, vec4(0.2, 0.6, 0.7, 1));
    
    float innerR = 0.45;
    float outerR = innerR + 10.0 * pix1;
    color = addRing(color, ab, vec2(0), innerR, outerR, vec4(vec3(0.9375), 1));
    
    fragColor = color;
        
    if (false) {
    
        // Normalized pixel coordinates (from 0 to 1)
        vec2 uv = fragCoord/iResolution.xy;

        // Time varying pixel color
        vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));

        // Output to screen
        fragColor = vec4(col,1.0);
        
    }
}
