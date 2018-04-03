#define NUM_HASHES  2
#define MIN_MATCHES 1 /* int(float(NUM_HASHES) * 0.4) */
#define HASH_SCALE 5.0

#define DOT_SPEED 0.5
#define DOT_RADIUS 0.23

#define DO_SMOOTH_REGIONS 1
#define DO_USE_DEFAULT_REGIONS 1

float pix1;

float[NUM_HASHES] angles;
float[NUM_HASHES] biases;
mat2[NUM_HASHES] rotations;

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

int hashValue(vec2 pt, int hashIdx) {
    vec2 rotated = rotations[hashIdx] * pt * HASH_SCALE;
    return int(floor(rotated.x + biases[hashIdx]));
}

int numHashMatches(vec2 pt1, vec2 pt2) {
    int numMatches = 0;
    for (int i = 0; i < NUM_HASHES; ++i) {
        if (hashValue(pt1, i) == hashValue(pt2, i)) ++numMatches;
    }
    return numMatches;
}

vec4 rawBackground(vec2 ab, vec2 dotCenter) {
    
    int numMatches = numHashMatches(ab, dotCenter);
    
    if (numMatches < MIN_MATCHES) return vec4(1);
    
    //return vec4(0, 1, 0, 1);
    
    float effectiveMatches = float(numMatches - MIN_MATCHES + 1);
    float matchRange = float(NUM_HASHES - MIN_MATCHES + 1);
    
    float matchPerc = clamp(1.0 - sqrt(1.0001 - effectiveMatches / matchRange), 0.0, 1.0);
    
    return matchPerc * vec4(0, 1, 0, 1) + (1.0 - matchPerc) * vec4(1);
}

vec4 smoothedBackground(vec2 ab, vec2 dotCenter) {
    
    vec4 color;
    
    /*
    color += 0.25 * rawBackground(ab, dotCenter);
    color += 0.25 * rawBackground(ab + vec2(pix1, 0), dotCenter);
    color += 0.25 * rawBackground(ab + vec2(0, pix1), dotCenter);
    color += 0.25 * rawBackground(ab + vec2(pix1, pix1), dotCenter);
    */
    
    int n = 40;
    for (int i = 0; i < n; ++i) {
        float a = random() * 6.28318;
        float r = pix1 * random() * 0.5;
        float x = r * cos(a), y = r * sin(a);
        color += rawBackground(ab + vec2(x, y), dotCenter);
    }

    return color / float(n);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    
    
    // Set up some drawing parameters.
    
    vec2 uv = fragCoord / iResolution.xy;
    
    float size = min(iResolution.x, iResolution.y);
    
    vec2 ab = fragCoord / size - iResolution.xy / size / 2.0;
    
    float pix10 = 10.0 / size;
    pix1 = 1.0 / size;
    
    
    // Set up hash parameters.
    
    for (int i = 0; i < NUM_HASHES; ++i) {
        
        
        
        float a = random() * 6.2831 - 0.0;
        biases[i] = random();
        
#if DO_USE_DEFAULT_REGIONS
        
        a = 3.141592 / 2.0 * float(i % 2);
        biases[i] = 0.0;
        
#endif
        
        angles[i] = a;
        float c = cos(a), s = sin(a);
        rotations[i] = mat2(c, s, -s, c);
    }

    
    // Draw.
    
    float dotAngle = 1.0 + iTime * DOT_SPEED;
    vec2 dotCenter = vec2(
        DOT_RADIUS * cos(dotAngle),
        DOT_RADIUS * sin(dotAngle)
    );
    
    // vec2 dotCenter = vec2(0.1, -0.1 + iTime * 0.05);

#if DO_SMOOTH_REGIONS
    vec4 color = smoothedBackground(ab, dotCenter);
#else
    vec4 color = rawBackground(ab, dotCenter);
#endif
    
    color = addDot(color, ab, dotCenter, 8.0 * pix1, vec4(1, 1, 1, 1));
    color = addDot(color, ab, dotCenter, 5.0 * pix1, vec4(0.2, 0.6, 0.7, 1));
    
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
