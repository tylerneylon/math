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

uint m_w = 123456789u;
uint m_z = 987654321u;
uint mask = 0xffffffffu;

vec2[100] pts = vec2[](vec2(-0.535321943461895, 0.4295355095528066), vec2(-0.3455339604988694, 0.5781337916851044), vec2(0.5878243749029934, 0.4318282278254628), vec2(-0.7316228882409632, -0.6400830261409283), vec2(-0.24590334435924888, 0.3465583869256079), vec2(0.6086754063144326, -0.006138277240097523), vec2(0.2968379491940141, -0.20609186217188835), vec2(-0.012490778230130672, -0.6294422629289329), vec2(-0.5992156048305333, -0.260216792114079), vec2(-0.386259273160249, -0.793105258140713), vec2(0.743629083968699, -0.14065651036798954), vec2(-0.31732933409512043, 0.7475894587114453), vec2(-0.860129808075726, 0.2962065269239247), vec2(0.16307402215898037, 0.16012793313711882), vec2(-0.8678832370787859, -0.2719850754365325), vec2(-0.02252437686547637, -0.7780120065435767), vec2(0.6620332477614284, 0.15317858289927244), vec2(0.5915716188028455, -0.509686691686511), vec2(-0.6633931687101722, -0.19809510000050068), vec2(-0.44641133258119226, 0.11668080976232886), vec2(-0.5845883144065738, -0.5162917347624898), vec2(-0.13429737277328968, 0.8619276266545057), vec2(-0.06455815862864256, 0.23555975407361984), vec2(0.6274884045124054, -0.5171835664659739), vec2(0.32493042340502143, -0.7797763305716217), vec2(0.614614405669272, -0.4309909394942224), vec2(-0.0858940458856523, -0.32921118941158056), vec2(-0.10856527928262949, -0.9388786503113806), vec2(-0.677517544478178, -0.1977822226472199), vec2(0.07517511583864689, -0.4720903253182769), vec2(-0.38207848044112325, -0.22233576141297817), vec2(0.1542930519208312, -0.27343158097937703), vec2(-0.012592678889632225, 0.7745655733160675), vec2(0.43840989051386714, -0.7125693541020155), vec2(-0.6039578230120242, 0.4176985048688948), vec2(0.3923057825304568, 0.47021224861964583), vec2(0.9245102130807936, -0.14055873220786452), vec2(0.5971200726926327, -0.015631013549864292), vec2(-0.49953667586669326, -0.4282863116823137), vec2(-0.6302933250553906, -0.27550983894616365), vec2(-0.26492602471262217, 0.3332039061933756), vec2(0.7774662747979164, 0.004644265864044428), vec2(-0.4643715489655733, -0.4456007913686335), vec2(0.41348149767145514, -0.4878529505804181), vec2(0.2606671447865665, 0.23059131065383554), vec2(0.4032703759148717, -0.6684201653115451), vec2(0.051315770484507084, -0.5641458928585052), vec2(-0.6947316857986152, 0.5841422737576067), vec2(-0.33171125408262014, -0.5309350658208132), vec2(0.7202151603996754, 0.0010640360414981842), vec2(-0.7163392035290599, 0.1140703004784882), vec2(-0.6017094957642257, 0.7040590015240014), vec2(-0.28748885449022055, 0.9231584295630455), vec2(0.6393345287069678, 0.6708396994508803), vec2(0.275118560064584, 0.2491940981708467), vec2(0.24743044143542647, 0.4354805606417358), vec2(0.23335021547973156, -0.8431176068261266), vec2(-0.4696110016666353, 0.36144260689616203), vec2(0.8432890637777746, -0.47524971328675747), vec2(-0.1464734966866672, 0.26941818417981267), vec2(0.43115733563899994, -0.49092355417087674), vec2(-0.47608552128076553, 0.8568301578052342), vec2(0.0017735548317432404, -0.3972976547665894), vec2(0.16829296993091702, -0.30237005185335875), vec2(0.09779989719390869, -0.9392144726589322), vec2(0.5074752024374902, 0.8485661600716412), vec2(-0.8275739043019712, -0.3655489166267216), vec2(0.49676403775811195, 0.4526951774023473), vec2(-0.1583074671216309, -0.5278087183833122), vec2(-0.266729065682739, 0.05201995186507702), vec2(-0.051900798920542, 0.98273741081357), vec2(0.5177820469252765, 0.6179546779021621), vec2(-0.8199729518964887, -0.02683536522090435), vec2(-0.243848308455199, 0.7919157301075757), vec2(0.584526180755347, 0.7760978299193084), vec2(-0.0963854556903243, -0.20782377291470766), vec2(0.8460431066341698, 0.4578654724173248), vec2(-0.12675654096528888, -0.9705787990242243), vec2(0.3576832776889205, 0.7977172816172242), vec2(0.3933431380428374, -0.6126642534509301), vec2(0.5312314215116203, 0.19665592862293124), vec2(-0.422224379144609, 0.09865726623684168), vec2(-0.004591297823935747, 0.8662284049205482), vec2(-0.46374952513724566, 0.7048413893207908), vec2(-0.5168197713792324, 0.4620737503282726), vec2(-0.4736833544448018, -0.46230480121448636), vec2(0.20229204557836056, 0.7832817980088294), vec2(0.2384101925417781, -0.8827322283759713), vec2(0.027442948892712593, -0.1637603952549398), vec2(0.35021050879731774, 0.11448327265679836), vec2(-0.4765624017454684, -0.18356141913682222), vec2(-0.8131860373541713, -0.0023889183066785336), vec2(-0.38862959994003177, -0.6411156416870654), vec2(-0.08588063437491655, -0.8633739058859646), vec2(-0.12956018559634686, -0.8850904679857194), vec2(-0.7437197281979024, -0.3851274633780122), vec2(0.17383599979802966, -0.5797490165568888), vec2(-0.5227011349052191, -0.8244012128561735), vec2(-0.9136027889326215, 0.01521686976775527), vec2(-0.3824459407478571, -0.037578845862299204));

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

// Insert (blended) background color wherever input color has alpha < 1.0.
vec4 addRawBackground(vec4 color, vec2 ab, vec2 dotCenter) {
    
    if (color.a == 1.0) return color;
    
    int numMatches = numHashMatches(ab, dotCenter);
    
    if (numMatches < MIN_MATCHES) return vec4(1);
    
    //return vec4(0, 1, 0, 1);
    
    float effectiveMatches = float(numMatches - MIN_MATCHES + 1);
    float matchRange = float(NUM_HASHES - MIN_MATCHES + 1);
    
    float matchPerc = clamp(1.0 - sqrt(1.0001 - effectiveMatches / matchRange), 0.0, 1.0);
    
    vec3 bgColor = matchPerc * vec3(0, 1, 0) + (1.0 - matchPerc) * vec3(1);
    
    return vec4(color.a * color.rgb + (1.0 - color.a) * bgColor, 1.0);
}

// Insert (blended) background color wherever input color has alpha < 1.0.
vec4 addSmoothedBackground(vec4 color, vec2 ab, vec2 dotCenter) {
    
    // TODO Consider short-circuiting here if color.a == 1.0.
    
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
        bgColor += addRawBackground(color, ab + vec2(x, y), dotCenter);
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
    
    // vec2 dotCenter = vec2(0.1, -0.1 + iTime * 0.05);
    
    vec4 color = vec4(0);

#if DO_SMOOTH_REGIONS
    color = addSmoothedBackground(color, ab, dotCenter);
#else
    color = addRawBackground(color, ab, dotCenter);
#endif
    
    float innerR = CIRCLE_RADIUS - 5.0 * pix1;
    float outerR = CIRCLE_RADIUS + 5.0 * pix1;
    color = addRing(color, ab, vec2(0), innerR, outerR, vec4(vec3(0.9375), 1));
    
    // Draw all dot backgrounds.
    color = addDot(color, ab, dotCenter, 8.0 * pix1, vec4(1, 1, 1, 1));
    for (int i = 0; i < pts.length(); ++i) {
        color = addDot(color, ab, pts[i], 8.0 * pix1, vec4(1, 1, 1, 1));
    }
    
    // Draw all dots.
    color = addDot(color, ab, dotCenter, 5.0 * pix1, vec4(0.2, 0.6, 0.7, 1));
    for (int i = 0; i < pts.length(); ++i) {
        color = addDot(color, ab, pts[i], 5.0 * pix1, vec4(0.2, 0.6, 0.7, 1));
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
