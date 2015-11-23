# ------------------------------------------------------------
# cdn2local.ps1
# The MIT License / (C) 2015 Retorillo
# ------------------------------------------------------------
# You can reduce CDN footprint by this script while debugging. 
# When comitting, use -reverse switch to restore remote URL
# First <script> and <link> in each line is only affected,
# and ignores single quoted URL.
# ------------------------------------------------------------

param([parameter(mandatory=$true)][string]$htmlpath, [switch]$reverse)

$htmlpath = resolve-path $htmlpath
$client = new-object net.webclient;
if ($reverse) {
	$r = new-object regex '(?<=<(script|link).*?(src|href)=")([^"]+)(?=")' 
}
else {
	$r = new-object regex '(?<=<(script|link).*?(src|href)=")((?:http://|https://)[^"]+)(?=")'
}

$tpath = $htmlpath + ".swp"
$hdir = split-path $htmlpath -parent
$ddir = join-path $hdir 'cdn2local'
$map = join-path $hdir 'cdn2local.map'
if (-not (test-path $ddir)) {
	[void](mkdir $ddir)
}
if (-not (test-path $map)) {
	if ($reverse) {
		throw new-object InvalidOperationException("map file not found, cannot reverse");
	}
	$x = new-object xml 
	[void]$x.appendChild($x.createElement('cdn2local'));
}
else {
	$x = [xml](type $map)
}
$x = $x.SelectSingleNode('cdn2local');	
$script:count = $x.selectNodes('map').count;

type $htmlpath -Encoding UTF8 |
	% { 
		$r.replace($_, {
			param($m)
			if ($reverse){
				$e = $x.selectSingleNode("map[@local='$($m.value)']");
				if ($e) {
					return $e.getattribute('cdn');
				}
				return $m.value;
			}
			else {
				$e = $x.selectSingleNode("map[@cdn='$($m.value)']");
				if (-not $e) {
					$script:count++;
					$apath = join-path $ddir "file$script:count";
					$rpath = $apath.substring($hdir.length + 1).replace('\', '/'); 
					$e = $x.ownerDocument.createElement('map');
					$e.setAttribute('cdn', $m.value);
					$e.setAttribute('local', $rpath);
					Write-Host $m.value -foreground yellow
					$client.downloadFile($m.value, $apath);
					[void]$x.appendChild($e);
				}
				return $e.getattribute('local');
			}
		});
	} > $tpath
$tcontent = type $tpath
type $htmlpath > $tpath
$tcontent | out-file -literalPath $htmlpath -encoding UTF8
$x.outerxml > $map
$client.dispose();
