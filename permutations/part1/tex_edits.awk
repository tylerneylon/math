/toprule|bottomrule|endhead/ {next}
$1=="\\(S_2\\)" {printf("%s[10pt]\n", $0); next}
/123 \\quad 132/ {printf("%s[10pt]\n", $0); next}
{print}
