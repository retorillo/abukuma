dir $PSScriptRoot -filter *.js |
% {
	$file = $_; $line = 0; type $file.fullname |
	% { 
		$line++; 
		if ($_ -imatch "//\s*TODO:") {
			write-host "$(split-path $file -leaf) ($line)" -foreground white -background darkgray 
			write-host "`t$($_.trim())" 
		}
	}
}
