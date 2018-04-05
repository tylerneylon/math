#define NUM_HASHES  2
#define MIN_MATCHES 1 /* int(float(NUM_HASHES) * 0.4) */
#define HASH_SCALE 5.0

#define DOT_RADIUS (5.0 * pix1)  /* TODO use this value */

#define MOVING_DOT_SPEED 0.5
#define MOVING_DOT_RADIUS 0.23

#define CIRCLE_RADIUS 0.45

#define DO_SMOOTH_REGIONS 1
#define DO_USE_DEFAULT_REGIONS 1

float pix1;

float[NUM_HASHES] angles;
float[NUM_HASHES] biases;
mat2[NUM_HASHES] rotations;

// Color: #5aa6b1
vec4 dotColor = vec4(0.3529, 0.6510, 0.6941, 1);

vec2 pts[100] = vec2[](
    vec2(-0.5353, 0.4295),
    vec2(-0.3455, 0.5781),
    vec2(0.5878, 0.4318),
    vec2(-0.7316, -0.6401),
    vec2(-0.2459, 0.3466),
    vec2(0.6087, -0.0061),
    vec2(0.2968, -0.2061),
    vec2(-0.0125, -0.6294),
    vec2(-0.5992, -0.2602),
    vec2(-0.3863, -0.7931),
    vec2(0.7436, -0.1407),
    vec2(-0.3173, 0.7476),
    vec2(-0.8601, 0.2962),
    vec2(0.1631, 0.1601),
    vec2(-0.8679, -0.2720),
    vec2(-0.0225, -0.7780),
    vec2(0.6620, 0.1532),
    vec2(0.5916, -0.5097),
    vec2(-0.6634, -0.1981),
    vec2(-0.4464, 0.1167),
    vec2(-0.5846, -0.5163),
    vec2(-0.1343, 0.8619),
    vec2(-0.0646, 0.2356),
    vec2(0.6275, -0.5172),
    vec2(0.3249, -0.7798),
    vec2(0.6146, -0.4310),
    vec2(-0.0859, -0.3292),
    vec2(-0.1086, -0.9389),
    vec2(-0.6775, -0.1978),
    vec2(0.0752, -0.4721),
    vec2(-0.3821, -0.2223),
    vec2(0.1543, -0.2734),
    vec2(-0.0126, 0.7746),
    vec2(0.4384, -0.7126),
    vec2(-0.6040, 0.4177),
    vec2(0.3923, 0.4702),
    vec2(0.9245, -0.1406),
    vec2(0.5971, -0.0156),
    vec2(-0.4995, -0.4283),
    vec2(-0.6303, -0.2755),
    vec2(-0.2649, 0.3332),
    vec2(0.7775, 0.0046),
    vec2(-0.4644, -0.4456),
    vec2(0.4135, -0.4879),
    vec2(0.2607, 0.2306),
    vec2(0.4033, -0.6684),
    vec2(0.0513, -0.5641),
    vec2(-0.6947, 0.5841),
    vec2(-0.3317, -0.5309),
    vec2(0.7202, 0.0011),
    vec2(-0.7163, 0.1141),
    vec2(-0.6017, 0.7041),
    vec2(-0.2875, 0.9232),
    vec2(0.6393, 0.6708),
    vec2(0.2751, 0.2492),
    vec2(0.2474, 0.4355),
    vec2(0.2334, -0.8431),
    vec2(-0.4696, 0.3614),
    vec2(0.8433, -0.4752),
    vec2(-0.1465, 0.2694),
    vec2(0.4312, -0.4909),
    vec2(-0.4761, 0.8568),
    vec2(0.0018, -0.3973),
    vec2(0.1683, -0.3024),
    vec2(0.0978, -0.9392),
    vec2(0.5075, 0.8486),
    vec2(-0.8276, -0.3655),
    vec2(0.4968, 0.4527),
    vec2(-0.1583, -0.5278),
    vec2(-0.2667, 0.0520),
    vec2(-0.0519, 0.9827),
    vec2(0.5178, 0.6180),
    vec2(-0.8200, -0.0268),
    vec2(-0.2438, 0.7919),
    vec2(0.5845, 0.7761),
    vec2(-0.0964, -0.2078),
    vec2(0.8460, 0.4579),
    vec2(-0.1268, -0.9706),
    vec2(0.3577, 0.7977),
    vec2(0.3933, -0.6127),
    vec2(0.5312, 0.1967),
    vec2(-0.4222, 0.0987),
    vec2(-0.0046, 0.8662),
    vec2(-0.4637, 0.7048),
    vec2(-0.5168, 0.4621),
    vec2(-0.4737, -0.4623),
    vec2(0.2023, 0.7833),
    vec2(0.2384, -0.8827),
    vec2(0.0274, -0.1638),
    vec2(0.3502, 0.1145),
    vec2(-0.4766, -0.1836),
    vec2(-0.8132, -0.0024),
    vec2(-0.3886, -0.6411),
    vec2(-0.0859, -0.8634),
    vec2(-0.1296, -0.8851),
    vec2(-0.7437, -0.3851),
    vec2(0.1738, -0.5797),
    vec2(-0.5227, -0.8244),
    vec2(-0.9136, 0.0152),
    vec2(-0.3824, -0.0376)
);

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
    float dotR_sq = dotDiff.x * dotDiff.x + dotDiff.y * dotDiff.y;
    if (dotR_sq > (radius + pix1) * (radius + pix1)) return color;
    float dotR = sqrt(dotR_sq);
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

// Insert (blended) background color wherever input color has alpha < 1.0.
vec4 addRawBackground(
        vec4 color,
        vec2 ab,
        vec2 dotCenter,
        float whiteOutside) {
    
    if (ab.x * ab.x + ab.y * ab.y > whiteOutside * whiteOutside) {
        return vec4(1);
    }

    if (color.a == 1.0) return color;
    
    int numMatches = numHashMatches(ab, dotCenter);
    
    if (numMatches < MIN_MATCHES) return vec4(1);
    
    //return vec4(0, 1, 0, 1);
    
    float effectiveMatches = float(numMatches - MIN_MATCHES + 1);
    float matchRange = float(NUM_HASHES - MIN_MATCHES + 1);
    
    float matchPerc = clamp(1.0 - sqrt(1.0001 - effectiveMatches / matchRange), 0.0, 1.0);
    
    vec4 bgColor = matchPerc * dotColor + (1.0 - matchPerc) * vec4(1);
    
    return vec4(color.a * color.rgb + (1.0 - color.a) * bgColor.rgb, 1.0);
}

// Insert (blended) background color wherever input color has alpha < 1.0.
vec4 addSmoothedBackground(
        vec4 color,
        vec2 ab,
        vec2 dotCenter,
        float whiteOutside) {
    
    if (ab.x * ab.x + ab.y * ab.y > whiteOutside * whiteOutside) {
        return vec4(1);
    }

    vec4 bgColor;
    
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
        bgColor += addRawBackground(
                color,
                ab + vec2(x, y),
                dotCenter,
                whiteOutside
        );
    }

    return bgColor / float(n);
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
    
    
    // Update dot positions.
    for (int i = 0; i < pts.length(); ++i) {
        pts[i] *= CIRCLE_RADIUS;
    }
    
    // Draw.
    
    float dotAngle = 1.0 + iTime * MOVING_DOT_SPEED;
    vec2 dotCenter = vec2(
        MOVING_DOT_RADIUS * cos(dotAngle),
        MOVING_DOT_RADIUS * sin(dotAngle)
    );
    
    vec4 color = vec4(0);

    float innerR = CIRCLE_RADIUS - 5.0 * pix1;
    float outerR = CIRCLE_RADIUS + 5.0 * pix1;

#if DO_SMOOTH_REGIONS
    color = addSmoothedBackground(color, ab, dotCenter, CIRCLE_RADIUS);
#else
    color = addRawBackground(color, ab, dotCenter, CIRCLE_RADIUS);
#endif
    
    color = addRing(color, ab, vec2(0), innerR, outerR, vec4(vec3(0.9375), 1));
    
    // Draw all dot backgrounds.
    color = addDot(color, ab, dotCenter, 8.0 * pix1, vec4(1, 1, 1, 1));
    for (int i = 0; i < pts.length(); ++i) {
        color = addDot(color, ab, pts[i], 8.0 * pix1, vec4(1, 1, 1, 1));
    }
    
    // Draw all dots.
    color = addDot(color, ab, dotCenter, 5.0 * pix1, dotColor);
    for (int i = 0; i < pts.length(); ++i) {
        color = addDot(color, ab, pts[i], 5.0 * pix1, dotColor);
    }
        
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
