---
title: RichardsFoam
cdate: 2025-10-29
date: Last Modified
---

### Brussels
#### 29-Oct-2025
The basic idea at this moment to try all simulation with one system size (1x1m) because last time 2x2m system with 5e-6 m/s rail fall rate gave no fingers which is weird? So to rule out the errors I prepared the cases from scratch. *transproperties are same* but *0.org* parameter can be different (however I checked and they look same).

**Progress:**
- Prepared a new directory format—Warsaw and Brussels categories—separating the simulations ran in Warsaw and future ones I am going to run.
- The directory looks like: 

> P3/P0.25/1x1m/corr_test/test_XYZ_ABC

- Ran correlation length test to see if different corr-len effect finger formation?

**What to do next:** 
- Next thing to try is following (as I can recall now):
	- Choose one corr-len -> try div(phi, C) scheme "Gauss linear Upwind"
	- Choose one corr-len -> Run different Rainfall rate
	- Choose one corr-len -> One Rainfall rate -> different soil parameter (n)
- Repeat all for P0.35 and P4, and larger system
- Now the idea is to see first effect of corr-len first, and then try with different Q, different fvScheme for div(phi, C), and soil parameters (Michał suggested it).
- Later we can extend it to larger system.


#### 30-Oct-2025
**Progress:**
- Created shortcuts to run **hpc** and **pvserver** faster.
- Added keys to *topola* and *rysy* for quick 'sshing'

> ssh topola (for topola)
> ssh rysy (for rysy)

- Run paraview server (function in .zshrc) on *Rysy* and do quick port forwarding:

> port-forward-hpc X

where "X" is the node number after running server on rysy.

- On *topola*, added a function "copyVTKtoRysy" to ".cshrc" file to copy VTK quickly to rysy without running /bin/bash. 
- It is assumed that VTK exist in testcase. Run

> copyVTKtoRysy /path/to/test_case

- Checked all simulation for 1,2 and 5cm corr len. Everything looks good (finger formation).

**What to do next:** 
Check previous entry.

#### 31-Oct-2025
**Progress:**
- Corr-test is going ok but I used 4 nodes to have only 28 cores. Reran the corr-test simulations
- Picked up 5cm corr-len case with 5e-6 rate and ran:
	- linear-upwind test
	- soil parameter (n) test-> n=1.2, 1.4, 1.6, 1.8

**Remark:**
- A point to remember is both above test sare done on the case prepared for corr-len test i.e for 5cm.

**What to do next:** 
Check previous entry (29 oct).

#### 14-Nov-2025
**Progress:**
- Reconstructed cases and viewed them in paraview.

**Remarks:**
- Linear upwind scheme, although showed a similar pattern growth as to linear scheme initially, blew up for concentration in the end. Flow solver seems working fine but not Concentration solver
- 